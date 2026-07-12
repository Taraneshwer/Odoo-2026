from sqlalchemy import Column, String, Float, DateTime, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from backend.core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    model = Column(String)
    make = Column(String)
    year = Column(Integer)
    type = Column(String)
    category = Column(String)
    max_load_capacity = Column(Float)
    current_odometer = Column(Float, default=0.0)
    acquisition_cost = Column(Float)
    acquisition_date = Column(Date)
    fuel_type = Column(String)
    status = Column(String, default="Available")  # Available, On Trip, In Shop, Retired
    last_maintenance_date = Column(Date)
    next_maintenance_due = Column(Date)
    insurance_expiry = Column(Date)
    registration_expiry = Column(Date)
    location_lat = Column(Float)
    location_lng = Column(Float)

    # Legacy alias kept for trip/maintenance route compatibility
    license_plate = Column(String, unique=True, index=True, nullable=True)
    max_capacity = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
