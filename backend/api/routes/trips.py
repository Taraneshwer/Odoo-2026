from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import datetime

from backend.api.dependencies import get_db_session
from backend.models.trip import Trip
from backend.models.driver import Driver
from backend.models.vehicle import Vehicle
from backend.schemas.trip import TripCreate, TripUpdate, TripResponse

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(trip: TripCreate, db: Session = Depends(get_db_session)):
    db_trip = db.query(Trip).filter(Trip.trip_number == trip.trip_number).first()
    if db_trip:
        raise HTTPException(status_code=400, detail="Trip number already exists")
    
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    new_trip = Trip(**trip.model_dump())
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

@router.patch("/{trip_id}/dispatch", response_model=TripResponse)
def dispatch_trip(trip_id: UUID, db: Session = Depends(get_db_session)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != "Draft":
        raise HTTPException(status_code=400, detail="Only Draft trips can be dispatched")
        
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    
    # Validation 1: Cargo Validation
    if trip.cargo_weight > vehicle.max_capacity:
        raise HTTPException(status_code=400, detail=f"Dispatch Blocked: Cargo weight ({trip.cargo_weight}) exceeds vehicle max capacity ({vehicle.max_capacity})")
        
    # Validation 2: Driver Rules
    if driver.license_expiry_date < datetime.date.today():
        raise HTTPException(status_code=400, detail="Dispatch Blocked: Driver licence has expired")
        
    if driver.status == "Suspended":
        raise HTTPException(status_code=400, detail="Dispatch Blocked: Driver is Suspended")
        
    if driver.status == "On Trip":
        raise HTTPException(status_code=400, detail="Dispatch Blocked: Driver is already On Trip")
        
    # Validation 3: Vehicle Rules
    if vehicle.status == "In Shop":
        raise HTTPException(status_code=400, detail="Dispatch Blocked: Vehicle is In Shop")
    if vehicle.status == "On Trip":
        raise HTTPException(status_code=400, detail="Dispatch Blocked: Vehicle is already On Trip")

    # Transitions
    trip.status = "Dispatched"
    trip.dispatched_at = datetime.datetime.utcnow()
    vehicle.status = "On Trip"
    driver.status = "On Trip"
    
    db.commit()
    db.refresh(trip)
    return trip

@router.patch("/{trip_id}/complete", response_model=TripResponse)
def complete_trip(trip_id: UUID, db: Session = Depends(get_db_session)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status not in ["Dispatched", "In Progress"]:
        raise HTTPException(status_code=400, detail="Only Dispatched or In Progress trips can be completed")
        
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    
    trip.status = "Completed"
    trip.completed_at = datetime.datetime.utcnow()
    if vehicle:
        vehicle.status = "Available"
    if driver:
        driver.status = "Available"
        
    db.commit()
    db.refresh(trip)
    return trip

@router.patch("/{trip_id}/cancel", response_model=TripResponse)
def cancel_trip(trip_id: UUID, db: Session = Depends(get_db_session)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status in ["Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Trip cannot be cancelled from its current status")
        
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    
    # If trip was already dispatched, free up driver/vehicle
    if trip.status in ["Dispatched", "In Progress"]:
        if vehicle:
            vehicle.status = "Available"
        if driver:
            driver.status = "Available"
            
    trip.status = "Cancelled"
    db.commit()
    db.refresh(trip)
    return trip

@router.get("/", response_model=List[TripResponse])
def get_trips(db: Session = Depends(get_db_session)):
    return db.query(Trip).all()
