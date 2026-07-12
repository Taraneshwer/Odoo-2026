from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from backend.core.database import Base

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=True)
    liters = Column(Float, nullable=False)
    cost_per_liter = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    fuel_type = Column(String)
    odometer_reading = Column(Float)
    station_name = Column(String)
    station_location = Column(String)
    date = Column(Date, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
