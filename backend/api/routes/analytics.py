from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import io
import csv
import datetime

from backend.core.database import get_db
from backend.core.security import require_roles, get_current_user
from backend.models.vehicle import Vehicle
from backend.models.driver import Driver
from backend.models.trip import Trip
from backend.models.maintenance import Maintenance
from backend.models.fuel_log import FuelLog
from backend.models.expense import Expense
from backend.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])


def _base_vehicle_query(db: Session, vehicle_type: Optional[str], status: Optional[str]):
    q = db.query(Vehicle)
    if vehicle_type:
        q = q.filter(Vehicle.type == vehicle_type)
    if status:
        q = q.filter(Vehicle.status == status)
    return q


@router.get("/dashboard")
def get_dashboard_kpis(
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    vehicle_status: Optional[str] = Query(None, description="Filter by vehicle status"),
    region: Optional[str] = Query(None, description="Filter by region (reserved for future use)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    all_vehicles = _base_vehicle_query(db, vehicle_type, vehicle_status).all()
    total_vehicles = len(all_vehicles)
    available_vehicles = sum(1 for v in all_vehicles if v.status == "Available")
    on_trip_vehicles = sum(1 for v in all_vehicles if v.status == "On Trip")
    in_shop_vehicles = sum(1 for v in all_vehicles if v.status == "In Shop")

    active_trips = db.query(Trip).filter(Trip.status.in_(["Dispatched", "In Progress"])).count()
    pending_trips = db.query(Trip).filter(Trip.status == "Draft").count()

    drivers_on_duty = db.query(Driver).filter(Driver.status == "On Trip").count()
    available_drivers = db.query(Driver).filter(Driver.status == "Available").count()
    total_drivers = db.query(Driver).count()

    fleet_utilization = round((on_trip_vehicles / total_vehicles * 100), 2) if total_vehicles > 0 else 0.0

    return {
        "total_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_on_trip": on_trip_vehicles,
        "vehicles_in_maintenance": in_shop_vehicles,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "available_drivers": available_drivers,
        "total_drivers": total_drivers,
        "fleet_utilization_pct": fleet_utilization,
        "filters_applied": {
            "vehicle_type": vehicle_type,
            "vehicle_status": vehicle_status,
            "region": region
        }
    }


@router.get("/fuel-efficiency")
def get_fuel_efficiency(
    vehicle_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "financial_analyst", "safety_officer", "admin"))
):
    """Fuel Efficiency = Total Distance Driven / Total Fuel Consumed per vehicle"""
    q = db.query(
        Vehicle.id,
        Vehicle.registration_number,
        Vehicle.make,
        Vehicle.model,
        func.coalesce(func.sum(FuelLog.liters), 0).label("total_liters"),
        func.coalesce(func.sum(FuelLog.total_cost), 0).label("total_fuel_cost"),
    ).outerjoin(FuelLog, FuelLog.vehicle_id == Vehicle.id)

    if vehicle_id:
        q = q.filter(Vehicle.id == vehicle_id)

    results = q.group_by(Vehicle.id, Vehicle.registration_number, Vehicle.make, Vehicle.model).all()

    output = []
    for row in results:
        trips = db.query(Trip).filter(Trip.vehicle_id == row.id, Trip.actual_distance != None).all()
        total_distance = sum((t.actual_distance or 0) for t in trips)

        efficiency = round(total_distance / float(row.total_liters), 2) if float(row.total_liters) > 0 else None

        output.append({
            "vehicle_id": str(row.id),
            "registration_number": row.registration_number,
            "make": row.make,
            "model": row.model,
            "total_distance_km": round(total_distance, 2),
            "total_fuel_liters": round(float(row.total_liters), 2),
            "total_fuel_cost": round(float(row.total_fuel_cost), 2),
            "fuel_efficiency_km_per_liter": efficiency,
        })

    return output


@router.get("/vehicle-roi")
def get_vehicle_roi(
    vehicle_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "financial_analyst", "admin"))
):
    """ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost"""
    vehicles = db.query(Vehicle)
    if vehicle_id:
        vehicles = vehicles.filter(Vehicle.id == vehicle_id)

    results = []
    for v in vehicles.all():
        fuel_cost = db.query(func.coalesce(func.sum(FuelLog.total_cost), 0)).filter(
            FuelLog.vehicle_id == v.id
        ).scalar()

        maintenance_cost = db.query(func.coalesce(func.sum(Maintenance.cost), 0)).filter(
            Maintenance.vehicle_id == v.id
        ).scalar()

        # Revenue estimate: sum of cargo_value from completed trips
        completed_trips = db.query(Trip).filter(
            Trip.vehicle_id == v.id,
            Trip.status == "Completed"
        ).all()
        revenue = sum((t.cargo_value or 0) for t in completed_trips)

        acquisition_cost = float(v.acquisition_cost or 0)
        total_cost = float(fuel_cost) + float(maintenance_cost)
        roi = round((revenue - total_cost) / acquisition_cost, 4) if acquisition_cost > 0 else None

        results.append({
            "vehicle_id": str(v.id),
            "registration_number": v.registration_number,
            "acquisition_cost": acquisition_cost,
            "total_revenue": round(revenue, 2),
            "total_fuel_cost": round(float(fuel_cost), 2),
            "total_maintenance_cost": round(float(maintenance_cost), 2),
            "total_operational_cost": round(total_cost, 2),
            "roi": roi,
            "roi_pct": round(roi * 100, 2) if roi is not None else None,
        })

    return results


@router.get("/export/dashboard-report")
def export_dashboard_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "financial_analyst", "admin"))
):
    """Stream analytics data as a downloadable CSV file"""
    vehicles = db.query(Vehicle).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Vehicle ID", "Registration", "Make", "Model", "Status", "Type",
        "Acquisition Cost", "Total Fuel Cost", "Total Maintenance Cost",
        "Total Operational Cost", "Total Distance (km)", "Fuel Efficiency (km/L)",
        "Completed Trips", "Revenue (Cargo Value)", "ROI (%)"
    ])

    for v in vehicles:
        fuel_cost = db.query(func.coalesce(func.sum(FuelLog.total_cost), 0)).filter(
            FuelLog.vehicle_id == v.id).scalar()
        maintenance_cost = db.query(func.coalesce(func.sum(Maintenance.cost), 0)).filter(
            Maintenance.vehicle_id == v.id).scalar()
        fuel_liters = db.query(func.coalesce(func.sum(FuelLog.liters), 0)).filter(
            FuelLog.vehicle_id == v.id).scalar()

        completed_trips = db.query(Trip).filter(Trip.vehicle_id == v.id, Trip.status == "Completed").all()
        revenue = sum((t.cargo_value or 0) for t in completed_trips)
        total_distance = sum((t.actual_distance or 0) for t in completed_trips)

        acq_cost = float(v.acquisition_cost or 0)
        total_op_cost = float(fuel_cost) + float(maintenance_cost)
        efficiency = round(total_distance / float(fuel_liters), 2) if float(fuel_liters) > 0 else "N/A"
        roi = round((revenue - total_op_cost) / acq_cost * 100, 2) if acq_cost > 0 else "N/A"

        writer.writerow([
            str(v.id), v.registration_number, v.make, v.model, v.status, v.type,
            acq_cost, round(float(fuel_cost), 2), round(float(maintenance_cost), 2),
            round(total_op_cost, 2), round(total_distance, 2), efficiency,
            len(completed_trips), round(revenue, 2), roi
        ])

    output.seek(0)
    filename = f"transitops_report_{datetime.date.today().isoformat()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/fuel-report")
def export_fuel_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "financial_analyst", "admin"))
):
    fuel_logs = db.query(FuelLog).order_by(FuelLog.date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Log ID", "Vehicle ID", "Date", "Liters", "Cost/Liter",
        "Total Cost", "Fuel Type", "Odometer", "Station"
    ])
    for log in fuel_logs:
        writer.writerow([
            str(log.id), str(log.vehicle_id), log.date, log.liters,
            log.cost_per_liter, log.total_cost, log.fuel_type,
            log.odometer_reading, log.station_name
        ])

    output.seek(0)
    filename = f"transitops_fuel_report_{datetime.date.today().isoformat()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
