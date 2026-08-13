from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from . import models
from .events import router as events_router
from .booking import router as booking_router
from .auth import router as auth_router
from .auth import pwd_context


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# CREATE / RESET ADMIN
# =========================================================

db = SessionLocal()

try:
    admin = (
        db.query(models.Admin)
        .filter(models.Admin.username == "admin")
        .first()
    )

    hashed_password = pwd_context.hash("admin123")

    if admin:
        admin.password_hash = hashed_password
        print("ADMIN: password reset successfully.")
    else:
        admin = models.Admin(
            username="admin",
            password_hash=hashed_password
        )

        db.add(admin)
        print("ADMIN: user created successfully.")

    db.commit()

except Exception as e:
    db.rollback()
    print("ADMIN ERROR:", e)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://event-seat-booking-3wu8odltt-event-seat-booking.vercel.app",
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

app.include_router(events_router)
app.include_router(booking_router)
app.include_router(auth_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Event Seat Booking API is running"
    }