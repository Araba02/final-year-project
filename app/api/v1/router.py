"""app/api/v1/router.py — aggregates all v1 endpoint routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import analytics, auth, locations, rides, users, ws

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(rides.router)
api_router.include_router(locations.router)
api_router.include_router(analytics.router)
api_router.include_router(ws.router)