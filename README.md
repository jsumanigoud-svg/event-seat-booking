# Event Seat Booking System

A full-stack event seat booking system with admin authentication, event management, dynamic seat generation, and concurrency-safe seat booking.

## Live Demo

**Frontend:**  
https://event-seat-booking-3wu8odltt-event-seat-booking.vercel.app

**Backend API:**  
https://event-seat-booking-pkru.onrender.com

**Swagger API Documentation:**  
https://event-seat-booking-pkru.onrender.com/docs

---

## Features

- Admin authentication using JWT
- Admin event creation
- Dynamic seat generation
- Seat selection
- Seat booking
- Prevention of duplicate seat bookings
- Database-level concurrency protection
- MySQL database
- REST API using FastAPI
- Next.js frontend
- Responsive seat-booking interface
- CORS configuration for deployed frontend

---

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

---

## Database Design

The system uses the following main tables:

### Admin

Stores administrator login credentials.

- `id`
- `username`
- `password_hash`

Passwords are stored as hashed values rather than plain text.

### Event

Stores event information.

- `id`
- `name`
- `event_date`
- `rows`
- `columns`

### Seat

Stores individual seats belonging to an event.

- `id`
- `event_id`
- `row_number`
- `column_number`
- `is_blocked`

Each seat belongs to an event.

A unique constraint on:


event_id + row_number + column_number
## Database Design (continued)

### Booking

Stores confirmed seat bookings.

- `id`
- `event_id`
- `seat_id`
- `booker_name`
- `booker_email`
- `created_at`

A unique constraint on `(event_id, seat_id)` ensures a seat can only be booked once per event at the database level, independent of any application-level check.

---

## Concurrency Handling

To prevent double-booking when two requests target the same seat at nearly the same time:

- The booking endpoint wraps the check-and-insert in a single database transaction.
- [Choose one and delete the other:]
  - A unique constraint on `(event_id, seat_id)` in the `bookings` table causes the second concurrent insert to fail with an integrity error, which the API catches and returns as `409 Conflict`.
  - Row-level locking (`SELECT ... FOR UPDATE`) is used on the seat row during the check, so a second request blocks until the first transaction commits or rolls back, then sees the seat as unavailable.
- For multi-seat bookings, all seats in a request are validated and inserted within the same transaction — if any seat is already taken, the entire transaction rolls back and no seats are booked (all-or-nothing).

**Tested by:** firing two booking requests for the same seat in quick succession — one returns `201 Created`, the other returns `409 Conflict` with a clear error message.

---

## Admin Dashboard

The admin panel includes a booking summary per event showing:
- Total seats
- Seats booked
- Seats available
- A list of individual bookings (seat number, booker name/email, timestamp)
