from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class TripBase(BaseModel):
    trip_number: str
    source: str
    source_lat: Optional[float] = None
    source_lng: Optional[float] = None
    destination: str
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    vehicle_id: UUID
    driver_id: UUID
    cargo_description: Optional[str] = None
    cargo_weight: float
    cargo_value: Optional[float] = None
    planned_distance: Optional[float] = None
    actual_distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    fuel_efficiency: Optional[float] = None
    status: Optional[str] = "Draft"
    priority: Optional[str] = "Normal"
    delay_minutes: Optional[int] = 0
    notes: Optional[str] = None
    created_by: Optional[UUID] = None

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    status: Optional[str] = None
    cargo_weight: Optional[float] = None
    actual_distance: Optional[float] = None

class TripResponse(TripBase):
    id: UUID
    dispatched_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    estimated_arrival: Optional[datetime]
    actual_arrival: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
