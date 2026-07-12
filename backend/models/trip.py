from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from backend.core.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_number = Column(String, unique=True, index=True, nullable=False)
    
    source = Column(String, nullable=False)
    source_lat = Column(Float)
    source_lng = Column(Float)
    
    destination = Column(String, nullable=False)
    destination_lat = Column(Float)
    destination_lng = Column(Float)
    
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False)
    
    cargo_description = Column(Text)
    cargo_weight = Column(Float, nullable=False)
    cargo_value = Column(Float)
    
    planned_distance = Column(Float)
    actual_distance = Column(Float)
    fuel_consumed = Column(Float)
    fuel_efficiency = Column(Float)
    
    status = Column(String, default="Draft") # Draft, Dispatched, In Progress, Completed, Cancelled, Delayed
    priority = Column(String, default="Normal") # Low, Normal, High, Urgent
    
    dispatched_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    estimated_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    
    delay_minutes = Column(Integer, default=0)
    notes = Column(Text)
    
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
