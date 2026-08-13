from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models
from .events import router as events_router
from .booking import router as booking_router
from .auth import router as auth_router


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)

from .database import SessionLocal
from .models import Admin
from .auth import pwd_context

db = SessionLocal()

try:
    admin = db.query(Admin).filter(Admin.username == "admin").first()

    if admin:
        admin.password_hash = pwd_context.hash("admin123")
    else:
        admin = Admin(
            username="admin",
            password_hash=pwd_context.hash("admin123")
        )
        db.add(admin)

    db.commit()

finally:
    db.close()
# =========================================================
# CREATE FASTAPI APP
# =========================================================

app = FastAPI(
    title="Event Seat Booking API",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://event-seat-booking-[a-z0-9]+-event-seat-booking\.vercel\.app",
    allow_origins=[
        "https://event-seat-booking-mu.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    events_router
)

app.include_router(
    booking_router
)

app.include_router(
    auth_router
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Event Seat Booking API is running"
    }