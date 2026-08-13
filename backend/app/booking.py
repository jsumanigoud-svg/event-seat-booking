from .auth import get_current_admin
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import get_db
from .models import Booking, BookingSeat, Seat


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


# =========================================================
# SCHEMA
# =========================================================

class BookingCreate(BaseModel):
    name: str
    email: EmailStr
    event_id: int
    seat_ids: list[int]


# =========================================================
# CREATE BOOKING
# =========================================================

@router.post("/")
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db)
):

    # Prevent empty booking
    if not booking_data.seat_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one seat must be selected"
        )

    # Remove duplicate seat IDs
    seat_ids = list(
        dict.fromkeys(booking_data.seat_ids)
    )

    # Get requested seats
    seats = (
        db.query(Seat)
        .filter(
            Seat.event_id == booking_data.event_id,
            Seat.id.in_(seat_ids)
        )
        .all()
    )

    # Check whether all seats exist
    if len(seats) != len(seat_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more seats were not found"
        )

    # Check blocked seats
    blocked_seats = [
        seat.id
        for seat in seats
        if seat.is_blocked
    ]

    if blocked_seats:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "One or more seats are blocked",
                "seat_ids": blocked_seats
            }
        )

    # Check already booked seats
    already_booked = (
        db.query(BookingSeat)
        .filter(
            BookingSeat.event_id == booking_data.event_id,
            BookingSeat.seat_id.in_(seat_ids)
        )
        .all()
    )

    if already_booked:

        booked_ids = [
            item.seat_id
            for item in already_booked
        ]

        raise HTTPException(
            status_code=409,
            detail={
                "message": "One or more seats are already booked",
                "seat_ids": booked_ids
            }
        )

    try:

        # Create booking
        booking = Booking(
            name=booking_data.name,
            email=booking_data.email
        )

        db.add(booking)

        # Get booking ID
        db.flush()

        # Connect all selected seats
        for seat_id in seat_ids:

            booking_seat = BookingSeat(
                booking_id=booking.id,
                event_id=booking_data.event_id,
                seat_id=seat_id
            )

            db.add(booking_seat)

        # Save everything
        db.commit()

        db.refresh(booking)

        return {
            "message": "Booking successful",
            "booking_id": booking.id,
            "name": booking.name,
            "email": booking.email,
            "event_id": booking_data.event_id,
            "seat_ids": seat_ids,
            "total_seats": len(seat_ids)
        }

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "One or more selected seats were "
                "booked by another user. "
                "No seats were booked."
            )
        )

# =========================================================
# GET ALL BOOKINGS
# =========================================================

@router.get("/")
def get_all_bookings(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    bookings = (
        db.query(Booking)
        .order_by(Booking.created_at.desc())
        .all()
    )

    result = []

    for booking in bookings:

        booking_seats = (
            db.query(BookingSeat)
            .filter(
                BookingSeat.booking_id == booking.id
            )
            .all()
        )

        seat_details = []

        for booking_seat in booking_seats:

            seat = (
                db.query(Seat)
                .filter(
                    Seat.id == booking_seat.seat_id
                )
                .first()
            )

            if seat:
                seat_details.append({
                    "seat_id": seat.id,
                    "event_id": booking_seat.event_id,
                    "row": seat.row_number,
                    "column": seat.column_number
                })

        result.append({
            "booking_id": booking.id,
            "name": booking.name,
            "email": booking.email,
            "event_id": (
                booking_seats[0].event_id
                if booking_seats
                else None
            ),
            "seat_ids": [
                seat["seat_id"]
                for seat in seat_details
            ],
            "seats": seat_details,
            "total_seats": len(seat_details),
            "created_at": booking.created_at
        })

    return {
        "total_bookings": len(result),
        "bookings": result
    }
# =========================================================
# GET BOOKING
# =========================================================

@router.get("/{booking_id}")
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):

    # Find booking
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # Find all seats belonging to booking
    booking_seats = (
        db.query(BookingSeat)
        .filter(
            BookingSeat.booking_id == booking_id
        )
        .all()
    )

    if not booking_seats:
        raise HTTPException(
            status_code=404,
            detail="No seats found for this booking"
        )

    # Get complete seat information
    seat_details = []

    for booking_seat in booking_seats:

        seat = (
            db.query(Seat)
            .filter(
                Seat.id == booking_seat.seat_id
            )
            .first()
        )

        if seat:

            seat_details.append({
                "seat_id": seat.id,
                "event_id": booking_seat.event_id,
                "row": seat.row_number,
                "column": seat.column_number
            })

    # Return complete booking information
    return {
        "booking_id": booking.id,
        "name": booking.name,
        "email": booking.email,
        "event_id": (
            booking_seats[0].event_id
            if booking_seats
            else None
        ),
        "seat_ids": [
            item["seat_id"]
            for item in seat_details
        ],
        "total_seats": len(seat_details),
        "seats": seat_details,
        "created_at": booking.created_at
    }


# =========================================================
# CANCEL BOOKING
# =========================================================

@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):

    # Find booking
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # Delete booking
    db.delete(booking)

    db.commit()

    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking_id
    }