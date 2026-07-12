from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime
from typing import Optional

class DriverBase(BaseModel):
    user_id: Optional[UUID] = None
    name: str
    license_number: str
    license_category: Optional[str] = None
    license_expiry_date: date
    contact_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    safety_score: Optional[int] = 100
    total_trips_completed: Optional[int] = 0
    total_distance_driven: Optional[float] = 0.0
    status: Optional[str] = "Available"
    hire_date: Optional[date] = None

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    status: Optional[str] = None

class DriverResponse(DriverBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
