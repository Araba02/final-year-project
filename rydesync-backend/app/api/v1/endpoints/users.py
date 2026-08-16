"""
app/api/v1/endpoints/users.py
──────────────────────────────
User profile management, FCM token registration, and saved places CRUD.
"""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.api.deps import get_current_user
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import SavedPlace, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse, summary="Update current user profile")
async def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = payload.model_dump(exclude_unset=True)
    if "password" in update_data:
        current_user.hashed_password = hash_password(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.flush()
    return current_user


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate account",
)
async def deactivate_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.is_active = False
    await db.flush()


class FCMTokenRequest(BaseModel):
    token: str


@router.post(
    "/me/fcm-token",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Register or update FCM device token",
)
async def register_fcm_token(
    payload: FCMTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.fcm_token = payload.token
    await db.flush()


# ── Saved Places ──────────────────────────────────────────────────────────────

@router.get(
    "/me/saved-places",
    response_model=List[SavedPlace],
    summary="List user's saved places",
)
async def list_saved_places(current_user: User = Depends(get_current_user)):
    return current_user.saved_places or []


@router.post(
    "/me/saved-places",
    response_model=SavedPlace,
    status_code=status.HTTP_201_CREATED,
    summary="Add a saved place",
)
async def add_saved_place(
    payload: SavedPlace,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    places = list(current_user.saved_places or [])
    place_dict = payload.model_dump()
    if not place_dict.get("id"):
        place_dict["id"] = str(uuid.uuid4())
    places.append(place_dict)
    current_user.saved_places = places
    flag_modified(current_user, "saved_places")
    await db.flush()
    return place_dict


@router.delete(
    "/me/saved-places/{place_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a saved place",
)
async def remove_saved_place(
    place_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    places = [p for p in (current_user.saved_places or []) if p.get("id") != place_id]
    if len(places) == len(current_user.saved_places or []):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    current_user.saved_places = places
    flag_modified(current_user, "saved_places")
    await db.flush()
