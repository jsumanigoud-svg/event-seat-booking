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

```text
event_id + row_number + column_number
