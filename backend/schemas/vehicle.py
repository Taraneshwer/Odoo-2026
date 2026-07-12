from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime
from typing import Optional

class VehicleBase(BaseModel):
    registration_number: str
    name: Optional[str] = None
    model: Optional[str] = None
    make: Optional[str] = None
    year: Optional[int] = None
    type: Optional[str] = None
    category: Optional[str] = None
    max_load_capacity: Optional[float] = None
    current_odometer: Optional[float] = 0.0
    acquisition_cost: Optional[float] = None
    acquisition_date: Optional[date] = None
    fuel_type: Optional[str] = None
    status: Optional[str] = "Available"
    last_maintenance_date: Optional[date] = None
    next_maintenance_due: Optional[date] = None
    insurance_expiry: Optional[date] = None
    registration_expiry: Optional[date] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    # Legacy
    license_plate: Optional[str] = None
    max_capacity: Optional[float] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    current_odometer: Optional[float] = None
    next_maintenance_due: Optional[date] = None
    insurance_expiry: Optional[date] = None
    registration_expiry: Optional[date] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None

class VehicleResponse(VehicleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
