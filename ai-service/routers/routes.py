from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import List
from services.optimizer import Stop, optimize_route

router = APIRouter()


# ─────────────────────────────────────────
# REQUEST / RESPONSE MODELS
# ─────────────────────────────────────────

class StopInput(BaseModel):
    reportId: str
    lat: float
    lng: float
    severity: str

    @field_validator('lat')
    @classmethod
    def validate_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('lng')
    @classmethod
    def validate_lng(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v

    @field_validator('severity')
    @classmethod
    def validate_severity(cls, v):
        if v not in ('LOW', 'MEDIUM', 'HIGH'):
            raise ValueError('Severity must be LOW, MEDIUM or HIGH')
        return v


class OptimizeRequest(BaseModel):
    stops: List[StopInput]


class StopOutput(BaseModel):
    reportId: str
    reportIds: List[str]
    lat: float
    lng: float
    severity: str


class OptimizeResponse(BaseModel):
    orderedStops: List[StopOutput]
    totalDistanceKm: float
    estimatedDurationMin: int


# ─────────────────────────────────────────
# ENDPOINT
# ─────────────────────────────────────────

@router.post("/optimize", response_model=OptimizeResponse)
def optimize(request: OptimizeRequest):
    """
    Optimize a collection route using OR-Tools TSP solver.
    - Clusters stops within 100m radius into single collection points
    - Returns the optimal order to minimize total distance
    - Calculates estimated duration based on average urban speed (30 km/h)
    """
    if len(request.stops) == 0:
        raise HTTPException(status_code=400, detail="At least one stop is required")
    stops = [
        Stop(
            report_id=s.reportId,
            lat=s.lat,
            lng=s.lng,
            severity=s.severity,
        )
        for s in request.stops
    ]

    result = optimize_route(stops)
    return result
