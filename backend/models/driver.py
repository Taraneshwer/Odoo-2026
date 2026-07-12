from sqlalchemy import Column, String, Date, DateTime, Integer, Float, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from backend.core.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True) # Optional FK for now as users table is missing
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    license_category = Column(String)
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String)
    emergency_contact = Column(String)
    address = Column(Text)
    safety_score = Column(Integer, default=100)
    total_trips_completed = Column(Integer, default=0)
    total_distance_driven = Column(Float, default=0.0)
    status = Column(String, default="Available") # Available, On Trip, Off Duty, Suspended
    hire_date = Column(Date)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
