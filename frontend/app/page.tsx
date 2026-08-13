"use client";

import { useEffect, useState } from "react";

interface Seat {
  id: number;
  row: number;
  column: number;
  is_blocked: boolean;
  is_booked: boolean;
}

interface EventData {
  event_id: number;
  event_name: string;
  total_seats: number;
  seats: Seat[];
}

interface EventListItem {
  event_id: number;
  name: string;
  event_date: string;
  rows: number;
  columns: number;
  total_seats: number;
}

interface EventListResponse {
  events: EventListItem[];
}

interface BookingSeatDetail {
  seat_id: number;
  row: number;
  column: number;
}

interface BookingDetails {
  booking_id: number;
  name: string;
  email: string;
  event_id: number;
  seat_ids?: number[];
  seats?: BookingSeatDetail[];
  total_seats: number;
  created_at?: string;
}

interface ApiError {
  detail?:
    | Array<{
        loc?: string[];
        msg?: string;
        type?: string;
      }>
    | string
    | {
        message?: string;
        seat_ids?: number[];
      };
  message?: string;
  booking_id?: number;
  seat_ids?: number[];
  total_seats?: number;
  name?: string;
  email?: string;
  event_id?: number;
  created_at?: string;
}

export default function Home() {
  const API_URL = "https://event-seat-booking-pkru.onrender.com";

  const [events, setEvents] =
    useState<EventListItem[]>([]);

  const [selectedEventId, setSelectedEventId] =
    useState<number | null>(null);

  const [event, setEvent] =
    useState<EventData | null>(null);

  const [selectedSeats, setSelectedSeats] =
    useState<number[]>([]);

  const [bookedSeatNumbers, setBookedSeatNumbers] =
    useState<string[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [bookingId, setBookingId] =
    useState<number | null>(null);

  const [cancelling, setCancelling] =
    useState(false);

  const [searchBookingId, setSearchBookingId] =
    useState("");

  const [bookingDetails, setBookingDetails] =
    useState<BookingDetails | null>(null);

  const [searchingBooking, setSearchingBooking] =
    useState(false);

  // =========================================================
  // LOAD ALL EVENTS
  // =========================================================

  async function loadEvents() {
    try {
      const response = await fetch(
        `${API_URL}/events/`
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data: EventListResponse =
        await response.json();

      setEvents(data.events);

      if (
        data.events.length > 0 &&
        selectedEventId === null
      ) {
        setSelectedEventId(
          data.events[0].event_id
        );
      }

      return data.events;

    } catch (error) {
      console.error(
        "Error loading events:",
        error
      );

      setMessage(
        "Unable to load events."
      );

      return [];
    }
  }

  // =========================================================
  // LOAD SELECTED EVENT SEATS
  // =========================================================

  async function loadEvent(
    eventId: number
  ) {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/events/${eventId}/seats`
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data: EventData =
        await response.json();

      setEvent(data);

    } catch (error) {
      console.error(
        "Error loading event:",
        error
      );

      setEvent(null);

      setMessage(
        "Unable to load selected event."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    async function initialize() {
      setLoading(true);

      const loadedEvents =
        await loadEvents();

      if (loadedEvents.length > 0) {
        await loadEvent(
          loadedEvents[0].event_id
        );
      } else {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // =========================================================
  // CHANGE EVENT
  // =========================================================

  async function handleEventChange(
    eventId: number
  ) {
    setSelectedEventId(eventId);

    setSelectedSeats([]);

    setBookedSeatNumbers([]);

    setBookingId(null);

    setBookingDetails(null);

    setMessage("");

    await loadEvent(eventId);
  }

  // =========================================================
  // SELECT / UNSELECT SEAT
  // =========================================================

  function toggleSeat(seat: Seat) {
    if (
      seat.is_booked ||
      seat.is_blocked ||
      booking
    ) {
      return;
    }

    setSelectedSeats((current) => {

      if (current.includes(seat.id)) {
        return current.filter(
          (id) => id !== seat.id
        );
      }

      return [
        ...current,
        seat.id
      ];
    });

    setMessage("");
  }

  // =========================================================
  // BOOK SEATS
  // =========================================================

  async function bookSeats() {

    if (!name.trim()) {
      setMessage(
        "Please enter your name."
      );
      return;
    }

    if (!email.trim()) {
      setMessage(
        "Please enter your email."
      );
      return;
    }

    if (!email.includes("@")) {
      setMessage(
        "Please enter a valid email address."
      );
      return;
    }

    if (selectedSeats.length === 0) {
      setMessage(
        "Please select at least one seat."
      );
      return;
    }

    if (!event) {
      setMessage(
        "Event information is not available."
      );
      return;
    }

    setBooking(true);
    setMessage("");

    try {

      const selectedSeatIds = [
        ...selectedSeats
      ];

      const requestBody = {
        name: name.trim(),
        email: email.trim(),
        event_id: event.event_id,
        seat_ids: selectedSeatIds,
      };

      const response = await fetch(
        `${API_URL}/bookings/`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },

          body: JSON.stringify(
            requestBody
          ),
        }
      );

      const data: ApiError =
        await response.json();

      // =====================================================
      // VALIDATION ERROR
      // =====================================================

      if (response.status === 422) {

        if (Array.isArray(data.detail)) {

          const errors =
            data.detail
              .map((error) => {

                const field =
                  error.loc &&
                  error.loc.length > 0
                    ? error.loc[
                        error.loc.length - 1
                      ]
                    : "field";

                return `${field}: ${
                  error.msg ||
                  "Invalid value"
                }`;
              })
              .join(" | ");

          setMessage(
            `Validation error: ${errors}`
          );

        } else {

          setMessage(
            `Validation error: ${
              typeof data.detail ===
              "string"
                ? data.detail
                : "Invalid request"
            }`
          );
        }

        return;
      }

      // =====================================================
      // OTHER ERROR
      // =====================================================

      if (!response.ok) {

        if (
          typeof data.detail === "object" &&
          data.detail !== null &&
          !Array.isArray(data.detail)
        ) {

          setMessage(
            data.detail.message ||
              `Booking failed. Status: ${response.status}`
          );

        } else {

          setMessage(
            data.message ||
              (
                typeof data.detail ===
                "string"
                  ? data.detail
                  : `Booking failed. Status: ${response.status}`
              )
          );
        }

        return;
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      if (
        data.message !==
        "Booking successful"
      ) {

        setMessage(
          data.message ||
            "Booking failed."
        );

        return;
      }

      if (data.booking_id) {

        setBookingId(
          data.booking_id
        );

        const seatLabels =
          selectedSeatIds.map(
            (seatId) => {

              const seat =
                event.seats.find(
                  (item) =>
                    item.id === seatId
                );

              if (!seat) {
                return String(
                  seatId
                );
              }

              return `${seat.row}-${seat.column}`;
            }
          );

        setBookedSeatNumbers(
          seatLabels
        );
      }

      setMessage(
        "Booking successful! 🎉"
      );

      setSelectedSeats([]);

      await loadEvent(
        event.event_id
      );

    } catch (error) {

      console.error(
        "Booking error:",
        error
      );

      setMessage(
        "Unable to connect to the booking server."
      );

    } finally {

      setBooking(false);
    }
  }

  // =========================================================
  // FIND BOOKING
  // =========================================================

  async function findBooking() {

    if (!searchBookingId.trim()) {

      setMessage(
        "Please enter a booking ID."
      );

      return;
    }

    setSearchingBooking(true);
    setBookingDetails(null);
    setMessage("");

    try {

      const response =
        await fetch(
          `${API_URL}/bookings/${searchBookingId.trim()}`
        );

      const data:
        | BookingDetails
        | ApiError =
        await response.json();

      if (!response.ok) {

        const errorData =
          data as ApiError;

        let errorMessage =
          `Booking not found. Status: ${response.status}`;

        if (
          typeof errorData.detail ===
          "string"
        ) {

          errorMessage =
            errorData.detail;

        } else if (
          Array.isArray(
            errorData.detail
          )
        ) {

          errorMessage =
            errorData.detail
              .map(
                (error) =>
                  error.msg ||
                  "Invalid request"
              )
              .join(", ");

        } else if (
          errorData.message
        ) {

          errorMessage =
            errorData.message;
        }

        setMessage(
          errorMessage
        );

        return;
      }

      const booking =
        data as BookingDetails;

      const seatIds =
        booking.seat_ids || [];

      const seatDetails:
        BookingSeatDetail[] =
        seatIds
          .map((seatId) => {

            const seat =
              event?.seats.find(
                (item) =>
                  item.id === seatId
              );

            if (!seat) {
              return null;
            }

            return {
              seat_id: seat.id,
              row: seat.row,
              column: seat.column,
            };
          })
          .filter(
            (
              seat
            ): seat is BookingSeatDetail =>
              seat !== null
          );

      setBookingDetails({
        booking_id:
          booking.booking_id,

        name:
          booking.name,

        email:
          booking.email,

        event_id:
          booking.event_id,

        seat_ids:
          seatIds,

        seats:
          seatDetails,

        total_seats:
          booking.total_seats ??
          seatIds.length,

        created_at:
          booking.created_at,
      });

      setBookingId(
        booking.booking_id
      );

    } catch (error) {

      console.error(
        "Find booking error:",
        error
      );

      setMessage(
        "Unable to connect to the booking server."
      );

    } finally {

      setSearchingBooking(false);
    }
  }

  // =========================================================
  // CANCEL BOOKING
  // =========================================================

  async function cancelBooking() {

    if (!bookingId) {

      setMessage(
        "No booking found to cancel."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to cancel booking #${bookingId}?`
      );

    if (!confirmed) {
      return;
    }

    setCancelling(true);
    setMessage("");

    try {

      const response =
        await fetch(
          `${API_URL}/bookings/${bookingId}`,
          {
            method: "DELETE",
          }
        );

      const data: ApiError =
        await response.json();

      if (!response.ok) {

        setMessage(
          data.message ||
            (
              typeof data.detail ===
              "string"
                ? data.detail
                : `Cancellation failed. Status: ${response.status}`
            )
        );

        return;
      }

      setMessage(
        "Booking cancelled successfully! 🎉"
      );

      setBookingId(null);

      setBookedSeatNumbers([]);

      if (
        bookingDetails?.booking_id ===
        bookingId
      ) {
        setBookingDetails(null);
      }

      if (event) {
        await loadEvent(
          event.event_id
        );
      }

    } catch (error) {

      console.error(
        "Cancellation error:",
        error
      );

      setMessage(
        "Unable to connect to the booking server."
      );

    } finally {

      setCancelling(false);
    }
  }

  // =========================================================
  // NEW BOOKING
  // =========================================================

  function startNewBooking() {

    setBookingId(null);

    setBookingDetails(null);

    setBookedSeatNumbers([]);

    setSelectedSeats([]);

    setMessage("");

    setName("");

    setEmail("");

    setSearchBookingId("");
  }

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading && !event) {

    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">

        <p className="text-lg text-gray-800">
          Loading events...
        </p>

      </main>
    );
  }

  // =========================================================
  // EVENT ERROR
  // =========================================================

  if (!event) {

    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">

        <div className="text-center">

          <p className="text-lg text-red-500">
            Unable to load event.
          </p>

          {message && (
            <p className="mt-2 text-gray-600">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={async () => {
              setLoading(true);

              const loadedEvents =
                await loadEvents();

              if (
                loadedEvents.length > 0
              ) {
                await loadEvent(
                  loadedEvents[0].event_id
                );
              }
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Retry
          </button>

        </div>

      </main>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-5xl mx-auto">

        {/* EVENT SELECTOR */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Select Event
          </h2>

          <select
            value={
              selectedEventId ?? ""
            }
            onChange={(e) =>
              handleEventChange(
                Number(e.target.value)
              )
            }
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-900"
          >

            {events.length === 0 ? (

              <option value="">
                No events available
              </option>

            ) : (

              events.map((item) => (

                <option
                  key={item.event_id}
                  value={item.event_id}
                >
                  {item.name} —{" "}
                  {item.event_date}
                </option>

              ))

            )}

          </select>

          <p className="text-gray-500 text-sm mt-2">
            Choose an event to view its available seats.
          </p>

        </div>

        {/* EVENT TITLE */}

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          {event.event_name}
        </h1>

        <div className="text-center mb-8">

  <p className="text-gray-600 mb-5">
    Select your seats
  </p>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">

    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-gray-500 text-sm">
        Total Seats
      </p>

      <p className="text-2xl font-bold text-blue-600 mt-1">
        {event.seats.length}
      </p>
    </div>

    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-gray-500 text-sm">
        Available
      </p>

      <p className="text-2xl font-bold text-green-600 mt-1">
        {
          event.seats.filter(
            (seat) =>
              !seat.is_booked &&
              !seat.is_blocked
          ).length
        }
      </p>
    </div>

    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-gray-500 text-sm">
        Booked
      </p>

      <p className="text-2xl font-bold text-red-600 mt-1">
        {
          event.seats.filter(
            (seat) =>
              seat.is_booked
          ).length
        }
      </p>
    </div>

    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-gray-500 text-sm">
        Blocked
      </p>

      <p className="text-2xl font-bold text-gray-600 mt-1">
        {
          event.seats.filter(
            (seat) =>
              seat.is_blocked
          ).length
        }
      </p>
    </div>

  </div>

</div>

        {/* STAGE */}

        <div className="bg-gray-800 text-white text-center py-3 rounded-lg max-w-2xl mx-auto mb-10">
          STAGE
        </div>

        {/* SEATS */}

        <div className="grid grid-cols-10 gap-3 max-w-2xl mx-auto">

          {event.seats.map(
            (seat) => {

              const isSelected =
                selectedSeats.includes(
                  seat.id
                );

              let seatColor =
                "bg-green-500 hover:bg-green-600";

              if (seat.is_booked) {

                seatColor =
                  "bg-red-500 cursor-not-allowed";

              } else if (
                seat.is_blocked
              ) {

                seatColor =
                  "bg-gray-500 cursor-not-allowed";

              } else if (
                isSelected
              ) {

                seatColor =
                  "bg-blue-500 hover:bg-blue-600";

              }

              return (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() =>
                    toggleSeat(seat)
                  }
                  disabled={
                    seat.is_booked ||
                    seat.is_blocked ||
                    booking
                  }
                  className={`h-10 rounded-md text-sm font-medium text-white transition ${seatColor}`}
                >
                  {seat.row}-
                  {seat.column}
                </button>
              );

            }
          )}

        </div>

        {/* LEGEND */}

        <div className="flex flex-wrap justify-center gap-6 mt-10 text-gray-700">

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-500 rounded" />
            <span>Available</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-500 rounded" />
            <span>Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-500 rounded" />
            <span>Booked</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-500 rounded" />
            <span>Blocked</span>
          </div>

        </div>

        {/* BOOKING FORM */}

        <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow">

          <h2 className="text-xl font-bold mb-4 text-center text-gray-900">
            Book Your Seats
          </h2>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setMessage("");
            }}
            className="w-full border rounded-lg p-3 mb-3 text-gray-900"
          />

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage("");
            }}
            className="w-full border rounded-lg p-3 mb-4 text-gray-900"
          />

          <p className="mb-4 text-center text-gray-700">

            <strong>
              Selected seats:
            </strong>{" "}

            {selectedSeats.length === 0
              ? "None"
              : selectedSeats
                  .map((seatId) => {

                    const seat =
                      event.seats.find(
                        (item) =>
                          item.id === seatId
                      );

                    return seat
                      ? `${seat.row}-${seat.column}`
                      : seatId;

                  })
                  .join(", ")}

          </p>

          <button
            type="button"
            onClick={bookSeats}
            disabled={booking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400"
          >
            {booking
              ? "Booking..."
              : "BOOK SEATS"}
          </button>

          {/* BOOKING CONFIRMATION */}

          {bookingId && (
            <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-5">

              <div className="text-center">

                <div className="text-4xl mb-2">
                  🎉
                </div>

                <h3 className="text-xl font-bold text-green-700">
                  Booking Confirmed!
                </h3>

                <p className="text-gray-600 mt-2">
                  Your seats have been successfully booked.
                </p>

              </div>

              <div className="mt-5 bg-white rounded-lg p-4 space-y-3">

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Event
                  </span>

                  <strong className="text-gray-900 text-right">
                    {event.event_name}
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Booking ID
                  </span>

                  <strong className="text-gray-900">
                    #{bookingId}
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Name
                  </span>

                  <strong className="text-gray-900">
                    {name}
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Email
                  </span>

                  <strong className="text-gray-900">
                    {email}
                  </strong>
                </div>

                <div>

                  <span className="text-gray-500">
                    Seats
                  </span>

                  <div className="flex flex-wrap gap-2 mt-2">

                    {bookedSeatNumbers.map(
                      (seat) => (

                        <span
                          key={seat}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold"
                        >
                          {seat}
                        </span>

                      )
                    )}

                  </div>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-gray-500">
                    Total Seats
                  </span>

                  <strong className="text-gray-900">
                    {
                      bookedSeatNumbers.length
                    }
                  </strong>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  startNewBooking
                }
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
              >
                BOOK MORE SEATS
              </button>

              <button
                type="button"
                onClick={
                  cancelBooking
                }
                disabled={
                  cancelling
                }
                className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400"
              >
                {cancelling
                  ? "Cancelling..."
                  : "CANCEL BOOKING"}
              </button>

            </div>
          )}

          {/* MESSAGE */}

          {message && !bookingId && (
            <p
              className={`text-center mt-4 font-medium ${
                message
                  .toLowerCase()
                  .includes("success")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

        </div>

        {/* FIND BOOKING */}

        <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-xl shadow">

          <h2 className="text-xl font-bold mb-4 text-center text-gray-900">
            Find My Booking
          </h2>

          <input
            type="number"
            min="1"
            placeholder="Enter Booking ID"
            value={searchBookingId}
            onChange={(e) => {
              setSearchBookingId(
                e.target.value
              );

              setBookingDetails(
                null
              );

              setMessage("");
            }}
            className="w-full border rounded-lg p-3 mb-4 text-gray-900"
          />

          <button
            type="button"
            onClick={
              findBooking
            }
            disabled={
              searchingBooking
            }
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400"
          >
            {searchingBooking
              ? "Searching..."
              : "VIEW BOOKING"}
          </button>

          {bookingDetails && (
            <div className="mt-6 bg-gray-50 p-5 rounded-lg text-gray-800">

              <h2 className="text-xl font-bold mb-4">
                Booking Details
              </h2>

              <p className="mb-2">
                <strong>
                  Booking ID:
                </strong>{" "}
                {
                  bookingDetails.booking_id
                }
              </p>

              <p className="mb-2">
                <strong>
                  Name:
                </strong>{" "}
                {bookingDetails.name}
              </p>

              <p className="mb-2">
                <strong>
                  Email:
                </strong>{" "}
                {bookingDetails.email}
              </p>

              <p className="mb-4">
                <strong>
                  Event ID:
                </strong>{" "}
                {bookingDetails.event_id}
              </p>

              <h3 className="font-bold mb-3">
                Booked Seats
              </h3>

              <div className="space-y-2">

                {bookingDetails.seats &&
                bookingDetails.seats.length >
                  0 ? (

                  bookingDetails.seats.map(
                    (seat) => (

                      <div
                        key={
                          seat.seat_id
                        }
                        className="bg-white border rounded-lg p-3"
                      >

                        <p>
                          <strong>
                            Seat ID:
                          </strong>{" "}
                          {seat.seat_id}
                        </p>

                        <p>
                          <strong>
                            Row:
                          </strong>{" "}
                          {seat.row}
                        </p>

                        <p>
                          <strong>
                            Column:
                          </strong>{" "}
                          {seat.column}
                        </p>

                      </div>

                    )
                  )

                ) : (

                  <p className="text-gray-600">
                    Seat information unavailable.
                  </p>

                )}

              </div>

              <p className="mt-4">
                <strong>
                  Total Seats:
                </strong>{" "}
                {
                  bookingDetails.total_seats
                }
              </p>

              <p className="mt-2">
                <strong>
                  Booked At:
                </strong>{" "}
                {bookingDetails.created_at ||
                  "Not available"}
              </p>

              <button
                type="button"
                onClick={
                  cancelBooking
                }
                disabled={
                  cancelling
                }
                className="w-full mt-5 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400"
              >
                {cancelling
                  ? "Cancelling..."
                  : "CANCEL THIS BOOKING"}
              </button>

            </div>
          )}

        </div>

      </div>

    </main>
  );
}