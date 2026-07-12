from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
import datetime

from backend.core.database import get_db
from backend.core.security import get_current_user, require_roles
from backend.models.fuel_log import FuelLog
from backend.models.expense import Expense
from backend.models.vehicle import Vehicle
from backend.models.user import User
from backend.schemas.financials import (
    FuelLogCreate, FuelLogResponse,
    ExpenseCreate, ExpenseResponse
)

router = APIRouter(tags=["Financials"])

# ─── Fuel Logs ──────────────────────────────────────────────────────────────

fuel_router = APIRouter(prefix="/fuel-logs")

@fuel_router.post("/", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
def log_fuel(
    data: FuelLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "dispatcher", "admin"))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    total_cost = data.total_cost if data.total_cost else round(data.liters * data.cost_per_liter, 2)
    entry = FuelLog(
        **data.model_dump(exclude={"total_cost"}),
        total_cost=total_cost,
        created_by=current_user.id
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@fuel_router.get("/", response_model=List[FuelLogResponse])
def get_fuel_logs(
    vehicle_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(FuelLog)
    if vehicle_id:
        q = q.filter(FuelLog.vehicle_id == vehicle_id)
    return q.order_by(FuelLog.date.desc()).all()

@fuel_router.get("/{log_id}", response_model=FuelLogResponse)
def get_fuel_log(
    log_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = db.query(FuelLog).filter(FuelLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    return log

# ─── Expenses ────────────────────────────────────────────────────────────────

expense_router = APIRouter(prefix="/expenses")

VALID_EXPENSE_TYPES = ["Toll", "Parking", "Repair", "Insurance", "Registration", "Other"]

@expense_router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def log_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "financial_analyst", "dispatcher", "admin"))
):
    if data.expense_type not in VALID_EXPENSE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid expense type. Must be one of: {', '.join(VALID_EXPENSE_TYPES)}")
    if data.vehicle_id and not db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first():
        raise HTTPException(status_code=404, detail="Vehicle not found")

    entry = Expense(**data.model_dump(), created_by=current_user.id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@expense_router.get("/", response_model=List[ExpenseResponse])
def get_expenses(
    vehicle_id: Optional[UUID] = Query(None),
    expense_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "financial_analyst", "admin"))
):
    q = db.query(Expense)
    if vehicle_id:
        q = q.filter(Expense.vehicle_id == vehicle_id)
    if expense_type:
        q = q.filter(Expense.expense_type == expense_type)
    return q.order_by(Expense.date.desc()).all()

@expense_router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "financial_analyst", "admin"))
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

router.include_router(fuel_router)
router.include_router(expense_router)
