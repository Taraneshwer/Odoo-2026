from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime
from typing import Optional

class FuelLogBase(BaseModel):
    vehicle_id: UUID
    trip_id: Optional[UUID] = None
    liters: float
    cost_per_liter: float
    total_cost: Optional[float] = None  # auto-computed if None
    fuel_type: Optional[str] = None
    odometer_reading: Optional[float] = None
    station_name: Optional[str] = None
    station_location: Optional[str] = None
    date: date

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogResponse(FuelLogBase):
    id: UUID
    total_cost: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    vehicle_id: Optional[UUID] = None
    trip_id: Optional[UUID] = None
    expense_type: str
    description: Optional[str] = None
    amount: float
    date: date
    receipt_image: Optional[str] = None
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
