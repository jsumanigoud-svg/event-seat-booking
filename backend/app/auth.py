from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

from .database import get_db
from .models import Admin


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# PASSWORD HASHING
# =========================================================

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)


# =========================================================
# JWT SETTINGS
# =========================================================

SECRET_KEY = "event-seat-booking-secret-key"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# SCHEMA
# =========================================================

class LoginRequest(BaseModel):
    username: str
    password: str


# =========================================================
# CREATE ACCESS TOKEN
# =========================================================

def create_access_token(
    username: str
):
    expire = (
        datetime.utcnow()
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": username,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================================================
# ADMIN LOGIN
# =========================================================

@router.post("/login")
def admin_login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):

    # Find admin
    admin = (
        db.query(Admin)
        .filter(
            Admin.username ==
            login_data.username
        )
        .first()
    )

    # Check username
    if not admin:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    # Check password
    password_correct = (
        pwd_context.verify(
            login_data.password,
            admin.password_hash
        )
    )

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    # Create JWT token
    access_token = create_access_token(
        admin.username
    )

    return {
        "message": "Login successful",
        "username": admin.username,
        "access_token": access_token,
        "token_type": "bearer"
    }
    # =========================================================
# VERIFY ADMIN TOKEN
# =========================================================

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")

        if not username:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )

    admin = (
        db.query(Admin)
        .filter(
            Admin.username == username
        )
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=401,
            detail="Admin account not found"
        )

    return admin