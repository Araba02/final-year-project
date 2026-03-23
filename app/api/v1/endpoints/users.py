"""
app/api/v1/endpoints/users.py
──────────────────────────────
User profile management + FCM token registration.
"""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

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
    summary="Register or update FCM device token for push notifications",
    description=(
        "The Flutter app calls this endpoint after receiving an FCM registration "
        "token from Firebase. The token is stored and used to send surge alerts "
        "and ride updates directly to the user's device."
    ),
)
async def register_fcm_token(
    payload: FCMTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.fcm_token = payload.token
    await db.flush()