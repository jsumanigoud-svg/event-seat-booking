from .auth import get_current_admin
from fastapi import APIRouter, Depends, HTTPException
from datetime import date
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db
from .models import Event, Seat, BookingSeat

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


# =========================================================
# SCHEMA
# =========================================================

class EventCreate(BaseModel):
    name: str
    event_date: date
    rows: int
    columns: int


# =========================================================
# CREATE EVENT
# =========================================================

@router.post("/")
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    if event_data.rows <= 0:
        raise HTTPException(
            status_code=400,
            detail="Rows must be greater than 0"
        )

    if event_data.columns <= 0:
        raise HTTPException(
            status_code=400,
            detail="Columns must be greater than 0"
        )

    event = Event(
        name=event_data.name,
        event_date=event_data.event_date,
        rows=event_data.rows,
        columns=event_data.columns
    )

    db.add(event)
    db.flush()

    for row in range(1, event_data.rows + 1):

        for column in range(
            1,
            event_data.columns + 1
        ):

            seat = Seat(
                event_id=event.id,
                row_number=row,
                column_number=column,
                is_blocked=False
            )

            db.add(seat)

    db.commit()
    db.refresh(event)

    return {
        "message": "Event created successfully",
        "event_id": event.id,
        "name": event.name,
        "event_date": event.event_date,
        "rows": event.rows,
        "columns": event.columns,
        "total_seats": (
            event.rows * event.columns
        )
    }


# =========================================================
# GET ALL EVENTS
# =========================================================

@router.get("/")
def get_all_events(
    db: Session = Depends(get_db)
):

    events = (
        db.query(Event)
        .order_by(Event.id)
        .all()
    )

    return {
        "events": [
            {
                "event_id": event.id,
                "name": event.name,
                "event_date": event.event_date,
                "rows": event.rows,
                "columns": event.columns,
                "total_seats": (
                    event.rows * event.columns
                )
            }
            for event in events
        ]
    }


# =========================================================
# GET EVENT SEATS
# =========================================================

@router.get("/{event_id}/seats")
def get_event_seats(
    event_id: int,
    db: Session = Depends(get_db)
):

    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    seats = (
        db.query(Seat)
        .filter(
            Seat.event_id == event_id
        )
        .order_by(
            Seat.row_number,
            Seat.column_number
        )
        .all()
    )

    booked_seat_ids = {
        booking.seat_id
        for booking in (
            db.query(BookingSeat)
            .filter(
                BookingSeat.event_id == event_id
            )
            .all()
        )
    }

    return {
        "event_id": event.id,
        "event_name": event.name,
        "total_seats": len(seats),

        "seats": [
            {
                "id": seat.id,
                "row": seat.row_number,
                "column": seat.column_number,
                "is_blocked": seat.is_blocked,
                "is_booked": (
                    seat.id
                    in booked_seat_ids
                )
            }

            for seat in seats
        ]
    }


# =========================================================
# BLOCK / UNBLOCK SEAT
# =========================================================

@router.patch("/{event_id}/seats/{seat_id}/block")
def toggle_seat_block(
    event_id: int,
    seat_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    seat = (
        db.query(Seat)
        .filter(
            Seat.id == seat_id,
            Seat.event_id == event_id
        )
        .first()
    )

    if not seat:
        raise HTTPException(
            status_code=404,
            detail="Seat not found"
        )

    existing_booking = (
        db.query(BookingSeat)
        .filter(
            BookingSeat.event_id == event_id,
            BookingSeat.seat_id == seat_id
        )
        .first()
    )

    if existing_booking:
        raise HTTPException(
            status_code=409,
            detail="Booked seats cannot be blocked"
        )

    seat.is_blocked = not seat.is_blocked

    db.commit()
    db.refresh(seat)

    return {
        "message": (
            "Seat blocked successfully"
            if seat.is_blocked
            else "Seat unblocked successfully"
        ),
        "event_id": event_id,
        "seat_id": seat.id,
        "row": seat.row_number,
        "column": seat.column_number,
        "is_blocked": seat.is_blocked
    }