from fastapi import APIRouter
from .auth import router as auth_router
from .vehicles import router as vehicles_router
from .drivers import router as drivers_router
from .trips import router as trips_router
from .maintenance import router as maintenance_router
from .financials import router as financials_router
from .analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(vehicles_router)
api_router.include_router(drivers_router)
api_router.include_router(trips_router)
api_router.include_router(maintenance_router)
api_router.include_router(financials_router)
api_router.include_router(analytics_router)
