from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import datetime

from backend.api.dependencies import get_db_session
from backend.models.maintenance import Maintenance
from backend.models.vehicle import Vehicle
from backend.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance(maintenance: MaintenanceCreate, db: Session = Depends(get_db_session)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == maintenance.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    if vehicle.status == "On Trip":
        raise HTTPException(status_code=400, detail="Cannot perform maintenance: Vehicle is currently On Trip")
        
    new_maintenance = Maintenance(**maintenance.model_dump())
    db.add(new_maintenance)
    
    # Automatic Transition (assume IN_SHOP for Scheduled or In Progress)
    if new_maintenance.status in ["Scheduled", "In Progress"]:
        vehicle.status = "In Shop"
        
    db.commit()
    db.refresh(new_maintenance)
    return new_maintenance

@router.patch("/{maintenance_id}/close", response_model=MaintenanceResponse)
def close_maintenance(maintenance_id: UUID, resolution_status: str, db: Session = Depends(get_db_session)):
    if resolution_status not in ["Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Status must be Completed or Cancelled")
        
    maint = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not maint:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
        
    if maint.status in ["Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Maintenance log is already closed")
        
    maint.status = resolution_status
    if resolution_status == "Completed":
        maint.completed_date = datetime.date.today()
    
    vehicle = db.query(Vehicle).filter(Vehicle.id == maint.vehicle_id).first()
    if vehicle and vehicle.status == "In Shop":
        vehicle.status = "Available"
        
    db.commit()
    db.refresh(maint)
    return maint

@router.get("/", response_model=List[MaintenanceResponse])
def get_maintenance_logs(db: Session = Depends(get_db_session)):
    return db.query(Maintenance).all()
