# Event Seat Booking System

## Live Demo

Frontend:
https://event-seat-booking-3wu8odltt-event-seat-booking.vercel.app

Backend API:
https://event-seat-booking-pkru.onrender.com

Swagger API Documentation:
https://event-seat-booking-pkru.onrender.com/docs

## Features

- Admin authentication using JWT
- Event creation
- Dynamic seat generation
- Seat selection
- Seat booking
- Prevention of duplicate seat bookings
- MySQL database
- REST API using FastAPI
- Next.js frontend
- CORS configuration for deployed frontend

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript

### Backend
- FastAPI
- Python
- SQLAlchemy
- JWT authentication

### Database
- MySQL

### Deployment
- Vercel — Frontend
- Render — Backend
- MySQL — Live database

## Database Design

The system uses the following main tables:

- Admin
- Event
- Seat
- Booking
- BookingSeat

### Relationships

Event → Seats  
Booking → BookingSeats  
Seat → BookingSeat

Each seat belongs to an event and has a unique row/column position.

## Concurrency Handling

The system prevents two users from booking the same seat simultaneously.

The `booking_seats` table uses a database-level unique constraint on:

- `event_id`
- `seat_id`

This ensures that the same seat cannot be inserted into two bookings for the same event.

If two requests attempt to book the same seat concurrently, the database rejects the duplicate operation rather than allowing the seat to be double-booked.

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
