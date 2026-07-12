from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from backend.api.dependencies import get_db_session
from backend.models.driver import Driver
from backend.schemas.driver import DriverCreate, DriverUpdate, DriverResponse

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(driver: DriverCreate, db: Session = Depends(get_db_session)):
    db_driver = db.query(Driver).filter(Driver.license_number == driver.license_number).first()
    if db_driver:
        raise HTTPException(status_code=400, detail="License number already registered")
    
    new_driver = Driver(**driver.model_dump())
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver

@router.get("/", response_model=List[DriverResponse])
def get_drivers(db: Session = Depends(get_db_session)):
    return db.query(Driver).all()

@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: UUID, db: Session = Depends(get_db_session)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver
