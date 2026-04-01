import math
from typing import List, Optional
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp


# ─────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────

class Stop:
    def __init__(self, report_id: str, lat: float, lng: float, severity: str, report_ids: Optional[List[str]] = None):
        self.report_id = report_id
        self.lat = lat
        self.lng = lng
        self.severity = severity
        # For clustered stops, contains all merged report IDs
        self.report_ids = report_ids or [report_id]


# ─────────────────────────────────────────
# HAVERSINE DISTANCE
# ─────────────────────────────────────────

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate the great-circle distance between two GPS points in kilometers."""
    R = 6371.0  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# ─────────────────────────────────────────
# CLUSTERING — group stops within 100m radius
# ─────────────────────────────────────────

CLUSTER_RADIUS_KM = 0.1  # 100 meters

def cluster_stops(stops: List[Stop]) -> List[Stop]:
    """
    Group stops that are within 100m of each other into a single stop.
    The cluster center is the centroid of all grouped stops.
    The highest severity in the cluster is used for the cluster.
    """
    if len(stops) <= 1:
        return stops

    severity_order = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    visited = [False] * len(stops)
    clusters: List[Stop] = []

    for i, stop in enumerate(stops):
        if visited[i]:
            continue

        group = [stop]
        visited[i] = True

        for j in range(i + 1, len(stops)):
            if visited[j]:
                continue
            dist = haversine_km(stop.lat, stop.lng, stops[j].lat, stops[j].lng)
            if dist <= CLUSTER_RADIUS_KM:
                group.append(stops[j])
                visited[j] = True

        # Compute centroid
        center_lat = sum(s.lat for s in group) / len(group)
        center_lng = sum(s.lng for s in group) / len(group)

        # Use highest severity in the cluster
        best_severity = max(group, key=lambda s: severity_order.get(s.severity, 0)).severity

        # Collect all report IDs in the cluster
        all_ids = [rid for s in group for rid in s.report_ids]

        clusters.append(Stop(
            report_id=group[0].report_id,
            lat=center_lat,
            lng=center_lng,
            severity=best_severity,
            report_ids=all_ids,
        ))

    return clusters


# ─────────────────────────────────────────
# ROUTE OPTIMIZATION — OR-Tools TSP solver
# ─────────────────────────────────────────

AVERAGE_SPEED_KMH = 30  # Average truck speed in urban Africa

def optimize_route(stops: List[Stop]) -> dict:
    """
    Solve the Traveling Salesman Problem using OR-Tools.
    Returns the ordered list of stops with total distance and estimated duration.
    """
    # Step 1 — Cluster nearby stops
    clustered = cluster_stops(stops)

    # Step 2 — Handle trivial cases
    if len(clustered) == 0:
        return {"orderedStops": [], "totalDistanceKm": 0.0, "estimatedDurationMin": 0}

    if len(clustered) == 1:
        return {
            "orderedStops": [_stop_to_dict(clustered[0])],
            "totalDistanceKm": 0.0,
            "estimatedDurationMin": 0,
        }

    # Step 3 — Build distance matrix (in meters, OR-Tools works with integers)
    n = len(clustered)
    distance_matrix = []
    for i in range(n):
        row = []
        for j in range(n):
            if i == j:
                row.append(0)
            else:
                dist_m = int(haversine_km(
                    clustered[i].lat, clustered[i].lng,
                    clustered[j].lat, clustered[j].lng
                ) * 1000)
                row.append(dist_m)
        distance_matrix.append(row)

    # Step 4 — Set up OR-Tools routing model
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)  # n nodes, 1 vehicle, depot at index 0
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Step 5 — Search parameters
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.seconds = 5  # Max 5 seconds to find solution

    # Step 6 — Solve
    solution = routing.SolveWithParameters(search_params)

    if not solution:
        # Fallback: return stops in original order if no solution found
        return {
            "orderedStops": [_stop_to_dict(s) for s in clustered],
            "totalDistanceKm": 0.0,
            "estimatedDurationMin": 0,
        }

    # Step 7 — Extract ordered route
    ordered: List[Stop] = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        ordered.append(clustered[node])
        index = solution.Value(routing.NextVar(index))

    # Step 8 — Calculate total distance
    total_m = solution.ObjectiveValue()
    total_km = round(total_m / 1000, 2)
    estimated_min = round((total_km / AVERAGE_SPEED_KMH) * 60)

    return {
        "orderedStops": [_stop_to_dict(s) for s in ordered],
        "totalDistanceKm": total_km,
        "estimatedDurationMin": estimated_min,
    }


def _stop_to_dict(stop: Stop) -> dict:
    return {
        "reportId": stop.report_id,
        "reportIds": stop.report_ids,
        "lat": stop.lat,
        "lng": stop.lng,
        "severity": stop.severity,
    }
