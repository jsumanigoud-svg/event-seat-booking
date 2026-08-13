from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def admin_login(
    login_data: LoginRequest
):
    # Temporary credentials for development.
    # We will move these to the database later.

    if (
        login_data.username != "admin"
        or login_data.password != "admin123"
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    return {
        "message": "Login successful",
        "username": "admin"
    }