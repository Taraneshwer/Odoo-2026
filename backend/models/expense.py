from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from backend.core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=True)
    expense_type = Column(String, nullable=False)  # Toll, Parking, Repair, Insurance, Registration, Other
    description = Column(Text)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    receipt_image = Column(String)
    notes = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
