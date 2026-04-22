from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import timedelta
from database import get_db
import models
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining", "icon": "🍔", "color": "#f59e0b"},
    {"name": "Transport", "icon": "🚗", "color": "#3b82f6"},
    {"name": "Bills & Utilities", "icon": "📄", "color": "#ef4444"},
    {"name": "Shopping", "icon": "🛍️", "color": "#8b5cf6"},
    {"name": "Entertainment", "icon": "🎬", "color": "#ec4899"},
    {"name": "Health", "icon": "💊", "color": "#10b981"},
    {"name": "Travel", "icon": "✈️", "color": "#06b6d4"},
    {"name": "Education", "icon": "📚", "color": "#f97316"},
    {"name": "Rent & Housing", "icon": "🏠", "color": "#84cc16"},
    {"name": "Other", "icon": "💰", "color": "#6366f1"},
]

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    currency: Optional[str] = "USD"

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/signup", response_model=TokenResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=data.name,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        currency=data.currency
    )
    db.add(user)
    db.flush()

    # Create default categories for user
    for cat in DEFAULT_CATEGORIES:
        category = models.Category(
            name=cat["name"],
            icon=cat["icon"],
            color=cat["color"],
            is_default=True,
            user_id=user.id
        )
        db.add(category)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "currency": user.currency, "role": user.role}
    }

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "currency": user.currency, "role": user.role}
    }

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "currency": current_user.currency,
        "role": current_user.role,
        "created_at": current_user.created_at
    }

@router.put("/profile")
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if data.name:
        current_user.name = data.name
    if data.currency:
        current_user.currency = data.currency
    db.commit()
    db.refresh(current_user)
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email, "currency": current_user.currency}

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates a password reset flow. For security, always returns 200
    regardless of whether the email exists (prevents user enumeration).

    In production: integrate an email provider (SendGrid, SES, etc.) to
    send a real reset link. The token below is a short-lived JWT that
    would be included in the reset URL, e.g.:
        https://yourapp.com/reset-password?token=<reset_token>

    The /reset-password endpoint (not yet implemented) would then verify
    the token and allow the user to set a new password.
    """
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if user and user.is_active:
        # Generate a short-lived reset token (15 minutes)
        reset_token = create_access_token(
            {"sub": str(user.id), "type": "password_reset"},
            expires_delta=timedelta(minutes=15)
        )

        # ── TODO: Send email ───────────────────────────────────────────
        # In production, call your email provider here:
        #
        # send_email(
        #     to=user.email,
        #     subject="Reset your Spendly password",
        #     body=f"Click here to reset: https://yourapp.com/reset-password?token={reset_token}"
        # )
        #
        # For now, log the token so you can test it locally:
        logger.warning(f"[DEV] Password reset token for {user.email}: {reset_token}")
        # ──────────────────────────────────────────────────────────────

    # Always return 200 to avoid leaking which emails exist
    return {"message": "If an account with that email exists, a reset link has been sent."}