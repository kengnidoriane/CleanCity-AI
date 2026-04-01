from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_optimize_route_returns_ordered_stops():
    """OR-Tools should return an ordered list of stops"""
    payload = {
        "stops": [
            {"reportId": "r1", "lat": 14.6928, "lng": -17.4467, "severity": "HIGH"},
            {"reportId": "r2", "lat": 14.7100, "lng": -17.4600, "severity": "LOW"},
            {"reportId": "r3", "lat": 14.6800, "lng": -17.4300, "severity": "MEDIUM"},
            {"reportId": "r4", "lat": 14.7200, "lng": -17.4800, "severity": "HIGH"},
        ]
    }
    response = client.post("/api/routes/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "orderedStops" in data
    assert "totalDistanceKm" in data
    assert "estimatedDurationMin" in data
    assert len(data["orderedStops"]) == 4
    # All report IDs must be present in the result
    result_ids = [s["reportId"] for s in data["orderedStops"]]
    assert set(result_ids) == {"r1", "r2", "r3", "r4"}


def test_optimize_route_clusters_nearby_stops():
    """Stops within 100m should be grouped into a single cluster"""
    payload = {
        "stops": [
            # These two are ~50m apart — should be clustered
            {"reportId": "r1", "lat": 14.6928, "lng": -17.4467, "severity": "HIGH"},
            {"reportId": "r2", "lat": 14.6929, "lng": -17.4468, "severity": "LOW"},
            # This one is far away
            {"reportId": "r3", "lat": 14.7200, "lng": -17.4800, "severity": "MEDIUM"},
        ]
    }
    response = client.post("/api/routes/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Should have 2 stops after clustering (r1+r2 merged, r3 alone)
    assert len(data["orderedStops"]) == 2


def test_optimize_route_requires_at_least_one_stop():
    """Empty stops list should return 400"""
    payload = {"stops": []}
    response = client.post("/api/routes/optimize", json=payload)
    assert response.status_code == 400


def test_optimize_single_stop():
    """Single stop should return immediately without optimization"""
    payload = {
        "stops": [
            {"reportId": "r1", "lat": 14.6928, "lng": -17.4467, "severity": "HIGH"},
        ]
    }
    response = client.post("/api/routes/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["orderedStops"]) == 1
    assert data["totalDistanceKm"] == 0.0
