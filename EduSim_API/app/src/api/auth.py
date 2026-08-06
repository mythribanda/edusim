import os
import uuid
import random
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from pydantic import BaseModel, EmailStr, Field, model_validator
from sqlalchemy.orm import Session
from sqlalchemy import func

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.src.config.database import get_db
from app.src.services.persistence_service import mark_user_active, record_login_event, record_refresh_token, record_user_session
from app.src.models.user import User
from app.src.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)

logger = logging.getLogger("EduSim.auth")
auth_router = APIRouter(tags=["Authentication"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


def normalize_email(raw_email: str) -> str:
    return raw_email.strip().lower()


# --- Pydantic Schemas ---

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    role: str = Field("student", pattern="^(student|teacher)$")
    mobile_number: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_mobile_number(cls, values):
        if isinstance(values, dict) and not values.get("mobile_number"):
            mobile = values.get("mobile")
            if mobile:
                values["mobile_number"] = mobile
        return values


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class SendOtpRequest(BaseModel):
    country_code: str = Field("+91")
    mobile_number: str = Field(..., min_length=5, max_length=15)


class VerifyOtpRequest(BaseModel):
    mobile_number: str
    otp_code: str = Field(..., min_length=6, max_length=6)


class UserResponse(BaseModel):
    id: UUID
    name: Optional[str]
    email: str
    role: str
    mobile_number: Optional[str] = None
    is_email_verified: bool
    is_mobile_verified: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterResponse(BaseModel):
    success: bool = True
    message: str
    id: UUID


# --- Helper to get current user from token ---

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication credentials"
        )
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is expired or invalid"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload contains no user ID"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists"
        )

    mark_user_active(db, user)
    db.commit()
    logger.info("User last_active_at updated (user_id=%s)", user.id)
    
    return user


# --- Routes ---

@auth_router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user, hashes password, and sends virtual email verification."""
    email = normalize_email(request.email)

    # Check if user already exists
    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    if request.mobile_number:
        existing_mobile_user = db.query(User).filter(User.mobile_number == request.mobile_number).first()
        if existing_mobile_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number is already registered"
            )

        if not request.mobile_number.isdigit() or len(request.mobile_number) != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid mobile number"
            )

    if len(request.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot exceed 72 bytes"
        )


    # Generate verification token
    verification_token = str(uuid.uuid4())
    
    # Hash password
    hashed_pwd = hash_password(request.password)
    
    new_user = User(
        name=request.name,
        email=email,
        password_hash=hashed_pwd,
        role=request.role,
        mobile_number=request.mobile_number,
        is_email_verified=False,
        is_mobile_verified=False,
        verification_token=verification_token
    )
    
    db.add(new_user)
    db.commit()
    logger.info("User registered (user_id=%s, email=%s)", new_user.id, email)
    db.refresh(new_user)
    
    # TODO:MOCK — replace these two lines when a real email provider is wired in
    logger.warning("[EMAIL SIMULATOR] Sent activation email to %s", new_user.email)
    logger.warning("[EMAIL SIMULATOR] Activation link sent (token omitted from logs)")
    
    return RegisterResponse(
        success=True,
        message="Account created successfully.",
        id=new_user.id,
    )


@auth_router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, http_request: Request, db: Session = Depends(get_db)):
    """Logs in user using email and password, issuing access & refresh tokens."""
    email = normalize_email(request.email)
    
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not verify_password(request.password, user.password_hash):
        record_login_event(
            db,
            user=user,
            email=email,
            success=False,
            provider="password",
            ip_address=http_request.client.host if http_request.client else None,
            user_agent=http_request.headers.get("user-agent"),
            failure_reason="Invalid email or password",
        )
        db.commit()
        logger.info("Login failure recorded (email=%s)", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    record_login_event(
        db,
        user=user,
        email=user.email,
        success=True,
        provider="password",
        ip_address=http_request.client.host if http_request.client else None,
        user_agent=http_request.headers.get("user-agent"),
    )
    record_user_session(
        db,
        user=user,
        session_key=refresh_token,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None,
        metadata={"source": "password-login"},
    )
    record_refresh_token(
        db,
        user=user,
        token_jti=refresh_token,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None,
        metadata={"source": "password-login"},
    )
    db.commit()
    logger.info("Login success — session recorded (user_id=%s)", user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "message": "Welcome back!"
    }


@auth_router.post("/google", response_model=TokenResponse)
def google_login(request: GoogleLoginRequest, http_request: Request, db: Session = Depends(get_db)):
    """Logs in or registers user using a Google ID token."""
    # 1. Verify the ID Token
    if request.id_token.startswith("mock_google_token_"):
        # Mock mode for local testing
        mock_email = request.id_token.replace("mock_google_token_", "")
        id_info = {
            "iss": "accounts.google.com",
            "email": mock_email,
            "name": mock_email.split("@")[0].capitalize(),
            "picture": None,
            "email_verified": True
        }
        logger.info("Using mock Google OAuth verification (email=%s)", mock_email)
    else:
        if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID == "your-google-client-id-here.apps.googleusercontent.com":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google OAuth Client ID is not configured on the backend"
            )
        try:
            id_info = id_token.verify_oauth2_token(
                request.id_token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )
        except ValueError as e:
            logger.error("Google ID Token verification failed: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google ID Token"
            )

        if id_info.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer"
            )

    email = normalize_email(id_info.get("email"))
    name = id_info.get("name")
    avatar = id_info.get("picture")

    # 2. Look up the user by email
    user = db.query(User).filter(func.lower(User.email) == email).first()

    # 3. Create user if not exists
    if not user:
        sentinel_pwd = "OAUTH_GOOGLE_SENTINEL_" + uuid.uuid4().hex
        user = User(
            name=name,
            email=email,
            password_hash=sentinel_pwd,
            role="student",
            is_email_verified=True,
            avatar=avatar
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("User registered via Google OAuth (user_id=%s, email=%s)", user.id, email)
    else:
        # Update details if missing
        if not user.avatar and avatar:
            user.avatar = avatar
            db.add(user)
            db.commit()
            db.refresh(user)

    # 4. Generate JWT tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # 5. Record session & login events
    record_login_event(
        db,
        user=user,
        email=user.email,
        success=True,
        provider="google",
        ip_address=http_request.client.host if http_request.client else None,
        user_agent=http_request.headers.get("user-agent"),
    )
    record_user_session(
        db,
        user=user,
        session_key=refresh_token,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None,
        metadata={"source": "google-oauth"},
    )
    record_refresh_token(
        db,
        user=user,
        token_jti=refresh_token,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None,
        metadata={"source": "google-oauth"},
    )
    db.commit()
    logger.info("Google OAuth login success — session recorded (user_id=%s)", user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "message": "Welcome!"
    }


@auth_router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refreshes access token using refresh token."""
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    mark_user_active(db, user)
    record_user_session(
        db,
        user=user,
        session_key=request.refresh_token,
        metadata={"source": "refresh"},
    )
    record_refresh_token(db, user=user, token_jti=request.refresh_token, metadata={"source": "refresh"})
    db.commit()
    logger.info("Token refresh — session recorded (user_id=%s)", user.id)
        
    # Re-issue both tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user
    }


@auth_router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verifies user email using the verification token."""
    user = db.query(User).filter(User.verification_token == request.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
        
    user.is_email_verified = True
    user.verification_token = None
    db.commit()
    logger.info("Email verified (user_id=%s)", user.id)
    
    return {"success": True, "message": "Email verified successfully."}


@auth_router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Sends a mock password reset link."""
    email = normalize_email(request.email)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email"
        )
    reset_token = str(uuid.uuid4())
    user.verification_token = reset_token
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    logger.info("Password reset token issued (user_id=%s)", user.id)
    
    # TODO:MOCK — replace these two lines when a real email provider is wired in
    logger.warning("[EMAIL SIMULATOR] Sent password reset instructions to %s", user.email)
    logger.warning("[EMAIL SIMULATOR] Reset link sent (token omitted from logs)")
    
    return {"success": True, "message": "Password reset instructions sent."}


@auth_router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets user password with a valid reset token."""
    user = db.query(User).filter(User.verification_token == request.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Validate expiry — mirrors the otp_expires_at check in verify_otp()
    token_expiry = user.reset_token_expires_at
    if not token_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    if token_expiry.tzinfo is None:
        token_expiry = token_expiry.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > token_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    user.password_hash = hash_password(request.new_password)
    user.verification_token = None
    user.reset_token_expires_at = None
    db.commit()
    logger.info("Password reset completed (user_id=%s)", user.id)
    
    return {"success": True, "message": "Password reset completed successfully."}


@auth_router.post("/send-otp")
def send_otp(request: SendOtpRequest, db: Session = Depends(get_db)):
    """Generates and logs a 6-digit OTP code to the mobile number (Simulated)."""
    user = db.query(User).filter(User.mobile_number == request.mobile_number).first()
    
    # For testing, if user doesn't exist, we can register them dynamically or throw an error.
    # To keep things simple and secure, we'll ask them to register first, or create a mock student user.
    if not user:
        # Create a mock user if they select mobile login to make testing super smooth
        mock_email = f"mobile_{request.mobile_number[-4:]}@edusim.local"
        user = db.query(User).filter(User.email == mock_email).first()
        if not user:
            user = User(
                name="Mobile Student",
                email=mock_email,
                password_hash=hash_password("MobilePass123!"),
                role="student",
                mobile_number=request.mobile_number,
                is_email_verified=True,
                is_mobile_verified=False
            )
            db.add(user)
            db.commit()
            logger.info("Mock mobile user created (mobile=%s)", request.mobile_number)
            db.refresh(user)

    otp = f"{random.randint(100000, 999999)}"
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    user.otp_code = otp
    user.otp_expires_at = expires
    # Reset brute-force counters so the new OTP starts with a clean slate
    user.otp_attempt_count = 0
    user.otp_locked_until = None
    db.commit()
    logger.info("OTP issued (user_id=%s)", user.id)
    
    # TODO:MOCK — replace these two lines when a real SMS provider is wired in
    logger.warning("[SMS SIMULATOR] Sent OTP to %s%s (value omitted from logs)",
                   request.country_code, request.mobile_number)
    logger.warning("[SMS SIMULATOR] Code will expire in 10 minutes")
    
    return {"success": True, "message": "OTP sent successfully."}


@auth_router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    """Verifies OTP and logs in user, issuing tokens."""
    _MAX_ATTEMPTS = 5
    _LOCKOUT_MINUTES = 15

    user = db.query(User).filter(User.mobile_number == request.mobile_number).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )

    now = datetime.now(timezone.utc)

    # --- Lockout check ---
    if user.otp_locked_until:
        locked_until = user.otp_locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if now < locked_until:
            retry_after = int((locked_until - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Too many failed attempts. "
                    f"OTP verification is locked for {retry_after} more second(s). "
                    f"Request a new OTP to reset the lock."
                ),
            )

    # --- OTP presence / correctness check ---
    if not user.otp_code or user.otp_code != request.otp_code:
        user.otp_attempt_count = (user.otp_attempt_count or 0) + 1
        if user.otp_attempt_count >= _MAX_ATTEMPTS:
            user.otp_locked_until = now + timedelta(minutes=_LOCKOUT_MINUTES)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Too many failed attempts. "
                    f"OTP verification is locked for {_LOCKOUT_MINUTES} minutes. "
                    f"Request a new OTP to reset the lock."
                ),
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )

    # --- Expiry check ---
    otp_expiry = user.otp_expires_at
    if not otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired"
        )
    if otp_expiry.tzinfo is None:
        otp_expiry = otp_expiry.replace(tzinfo=timezone.utc)
    if now > otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired"
        )

    # --- Success: clear OTP fields and reset brute-force counters ---
    user.is_mobile_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    user.otp_attempt_count = 0
    user.otp_locked_until = None
    user.last_login_at = now
    user.last_active_at = now
    db.commit()
    logger.info("OTP verified — mobile verified, session created (user_id=%s)", user.id)
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    record_user_session(db, user=user, session_key=refresh_token, metadata={"source": "otp"})
    record_refresh_token(db, user=user, token_jti=refresh_token, metadata={"source": "otp"})
    db.commit()
    logger.info("OTP login — tokens issued (user_id=%s)", user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "message": "Welcome back!"
    }


@auth_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile for currently logged in user."""
    return current_user
