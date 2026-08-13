from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Boolean,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    event_date = Column(Date, nullable=False)
    rows = Column(Integer, nullable=False)
    columns = Column(Integer, nullable=False)

    seats = relationship(
        "Seat",
        back_populates="event",
        cascade="all, delete-orphan"
    )


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)

    event_id = Column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False
    )

    row_number = Column(Integer, nullable=False)
    column_number = Column(Integer, nullable=False)

    is_blocked = Column(Boolean, default=False, nullable=False)

    event = relationship("Event", back_populates="seats")

    booking_seat = relationship(
        "BookingSeat",
        back_populates="seat",
        uselist=False,
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "row_number",
            "column_number",
            name="uq_event_seat_position"
        ),
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    seats = relationship(
        "BookingSeat",
        back_populates="booking",
        cascade="all, delete-orphan"
    )


class BookingSeat(Base):
    __tablename__ = "booking_seats"

    id = Column(Integer, primary_key=True, index=True)

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False
    )

    event_id = Column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False
    )

    seat_id = Column(
        Integer,
        ForeignKey("seats.id", ondelete="CASCADE"),
        nullable=False
    )

    booking = relationship(
        "Booking",
        back_populates="seats"
    )

    seat = relationship(
        "Seat",
        back_populates="booking_seat"
    )

    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "seat_id",
            name="uq_event_booked_seat"
        ),
    )
    # =========================================================
# ADMIN USER
# =========================================================

class Admin(Base):
    __tablename__ = "admins"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )