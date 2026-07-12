from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime, date
from typing import Optional, Any

class MaintenanceBase(BaseModel):
    vehicle_id: UUID
    maintenance_type: Optional[str] = None
    description: str
    cost: Optional[float] = None
    status: Optional[str] = "Scheduled"
    scheduled_date: Optional[date] = None
    started_date: Optional[date] = None
    completed_date: Optional[date] = None
    performed_by: Optional[str] = None
    notes: Optional[str] = None
    parts_used: Optional[Any] = None
    odometer_at_service: Optional[float] = None
    created_by: Optional[UUID] = None

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None
    cost: Optional[float] = None

class MaintenanceResponse(MaintenanceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
