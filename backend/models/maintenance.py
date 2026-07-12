from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import datetime
from backend.core.database import Base

class Maintenance(Base):
    __tablename__ = "maintenance_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    maintenance_type = Column(String)
    description = Column(Text, nullable=False)
    cost = Column(Float, nullable=True)
    status = Column(String, default="Scheduled") # Scheduled, In Progress, Completed, Cancelled
    
    scheduled_date = Column(Date)
    started_date = Column(Date)
    completed_date = Column(Date)
    
    performed_by = Column(String)
    notes = Column(Text)
    parts_used = Column(JSONB)
    odometer_at_service = Column(Float)
    
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
