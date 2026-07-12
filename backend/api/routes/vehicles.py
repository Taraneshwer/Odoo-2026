from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from backend.core.database import get_db
from backend.core.security import get_current_user, require_roles
from backend.models.vehicle import Vehicle
from backend.models.user import User
from backend.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["Vehicle Registry"])

@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "admin"))
):
    if db.query(Vehicle).filter(Vehicle.registration_number == vehicle.registration_number).first():
        raise HTTPException(status_code=400, detail="Registration number already registered")
    if vehicle.license_plate and db.query(Vehicle).filter(Vehicle.license_plate == vehicle.license_plate).first():
        raise HTTPException(status_code=400, detail="License plate already registered")

    new_vehicle = Vehicle(**vehicle.model_dump())
    # Sync legacy max_capacity with max_load_capacity
    if new_vehicle.max_load_capacity and not new_vehicle.max_capacity:
        new_vehicle.max_capacity = new_vehicle.max_load_capacity
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.get("/", response_model=List[VehicleResponse])
def get_vehicles(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Vehicle)
    if status:
        q = q.filter(Vehicle.status == status)
    if type:
        q = q.filter(Vehicle.type == type)
    return q.all()

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.patch("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: UUID,
    vehicle_data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "admin"))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field, value in vehicle_data.model_dump(exclude_none=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def retire_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "admin"))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle.status = "Retired"
    db.commit()

@router.get("/{vehicle_id}/operational-cost")
def get_vehicle_operational_cost(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "financial_analyst", "admin"))
):
    from sqlalchemy import func
    from backend.models.fuel_log import FuelLog
    from backend.models.maintenance import Maintenance

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    fuel_cost = db.query(func.coalesce(func.sum(FuelLog.total_cost), 0)).filter(
        FuelLog.vehicle_id == vehicle_id
    ).scalar()

    maintenance_cost = db.query(func.coalesce(func.sum(Maintenance.cost), 0)).filter(
        Maintenance.vehicle_id == vehicle_id
    ).scalar()

    total = float(fuel_cost) + float(maintenance_cost)

    return {
        "vehicle_id": str(vehicle_id),
        "registration_number": vehicle.registration_number,
        "fuel_cost": float(fuel_cost),
        "maintenance_cost": float(maintenance_cost),
        "total_operational_cost": total
    }
