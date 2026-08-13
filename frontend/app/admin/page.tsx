"use client";

import { useRouter } from "next/navigation";
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

interface BookingSeat {
  seat_id: number;
  event_id: number;
  row: number;
  column: number;
}

interface Booking {
  booking_id: number;
  name: string;
  email: string;
  event_id: number | null;
  seat_ids: number[];
  seats: BookingSeat[];
  total_seats: number;
  created_at: string;
}

interface BookingResponse {
  total_bookings: number;
  bookings: Booking[];
}

interface EventListResponse {
  events: EventListItem[];
}

export default function AdminPage() {
  const router = useRouter();
  const getAdminToken = () => {
  return localStorage.getItem(
    "adminToken"
  );
};

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const API_URL = "https://event-seat-booking-pkru.onrender.com";

  const [events, setEvents] =
    useState<EventListItem[]>([]);

  const [selectedEventId, setSelectedEventId] =
    useState<number | null>(null);

  const [event, setEvent] =
    useState<EventData | null>(null);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // CHECK ADMIN LOGIN
  // =========================================================

  useEffect(() => {
    const loggedIn =
      localStorage.getItem(
        "adminLoggedIn"
      );

    if (loggedIn !== "true") {
      router.replace(
        "/admin/login"
      );
      return;
    }

    setIsAuthenticated(true);
  }, [router]);

  // =========================================================
  // LOAD ALL EVENTS
  // =========================================================

  async function loadEvents() {
    const response = await fetch(
      `${API_URL}/events/`
    );

    if (!response.ok) {
      throw new Error(
        `Events server returned ${response.status}`
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
  }

  // =========================================================
  // LOAD EVENT
  // =========================================================

  async function loadEvent(
    eventId: number
  ) {
    const response = await fetch(
      `${API_URL}/events/${eventId}/seats`
    );

    if (!response.ok) {
      throw new Error(
        `Event server returned ${response.status}`
      );
    }

    const data: EventData =
      await response.json();

    setEvent(data);
  }

  // =========================================================
  // LOAD BOOKINGS
  // =========================================================

  async function loadBookings() {
    const token = getAdminToken();

    const response = await fetch(
      `${API_URL}/bookings/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Booking server returned ${response.status}`
      );
    }

    const data: BookingResponse =
      await response.json();

    setBookings(data.bookings);
  }

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const eventsResponse =
        await fetch(
          `${API_URL}/events/`
        );

      if (!eventsResponse.ok) {
        throw new Error(
          `Events server returned ${eventsResponse.status}`
        );
      }

      const eventsData:
        EventListResponse =
        await eventsResponse.json();

      setEvents(
        eventsData.events
      );

      let currentEventId =
        selectedEventId;

      if (
        currentEventId === null &&
        eventsData.events.length > 0
      ) {
        currentEventId =
          eventsData.events[0]
            .event_id;

        setSelectedEventId(
          currentEventId
        );
      }

      if (
        currentEventId !== null
      ) {
        await loadEvent(
          currentEventId
        );
      }

      await loadBookings();

    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        "Unable to load dashboard data."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOAD DASHBOARD AFTER LOGIN CHECK
  // =========================================================

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadDashboard();
  }, [isAuthenticated]);

  // =========================================================
  // CHANGE EVENT
  // =========================================================

  async function handleEventChange(
    eventId: number
  ) {
    try {
      setLoading(true);
      setError("");
      setSearch("");

      setSelectedEventId(
        eventId
      );

      await loadEvent(
        eventId
      );

      await loadBookings();

    } catch (error) {
      console.error(
        "Event change error:",
        error
      );

      setError(
        "Unable to load selected event."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // CREATE EVENT
  // =========================================================

  async function createEvent(
    eventData: {
      name: string;
      eventDate: string;
      rows: number;
      columns: number;
    }
  ) {
    try {

      const response =
        await fetch(
          `${API_URL}/events/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${getAdminToken()}`,
            },

            body: JSON.stringify({
              name: eventData.name,
              event_date:
                eventData.eventDate,
              rows: eventData.rows,
              columns:
                eventData.columns,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
            data.message ||
            "Unable to create event."
        );

        return;
      }

      alert(
        `Event created successfully!\n\nEvent ID: ${data.event_id}\nTotal Seats: ${data.total_seats}`
      );

      const form =
        document.getElementById(
          "create-event-form"
        ) as HTMLFormElement | null;

      form?.reset();

      const eventsResponse =
        await fetch(
          `${API_URL}/events/`
        );

      const eventsData:
        EventListResponse =
        await eventsResponse.json();

      setEvents(
        eventsData.events
      );

      setSelectedEventId(
        data.event_id
      );

      await loadEvent(
        data.event_id
      );

      await loadBookings();

    } catch (error) {

      console.error(
        "Create event error:",
        error
      );

      alert(
        "Unable to connect to the server."
      );
    }
  }

  // =========================================================
  // CANCEL BOOKING
  // =========================================================

  async function cancelBooking(
    bookingId: number
  ) {

    const confirmed =
      window.confirm(
        `Are you sure you want to cancel booking #${bookingId}?`
      );

    if (!confirmed) {
      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/bookings/${bookingId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
            data.message ||
            "Unable to cancel booking."
        );

        return;
      }

      alert(
        "Booking cancelled successfully."
      );

      if (
        selectedEventId !== null
      ) {

        await loadEvent(
          selectedEventId
        );
      }

      await loadBookings();

    } catch (error) {

      console.error(
        "Cancel error:",
        error
      );

      alert(
        "Unable to connect to the server."
      );
    }
  }

  // =========================================================
  // BLOCK / UNBLOCK SEAT
  // =========================================================

  async function toggleSeatBlock(
    seat: Seat
  ) {

    if (
      seat.is_booked ||
      selectedEventId === null
    ) {
      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/events/${selectedEventId}/seats/${seat.id}/block`,
          {
            method: "PATCH",
            headers: {
              Authorization:
                `Bearer ${getAdminToken()}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
            data.message ||
            "Unable to change seat status."
        );

        return;
      }

      await loadEvent(
        selectedEventId
      );

    } catch (error) {

      console.error(
        "Seat status error:",
        error
      );

      alert(
        "Unable to connect to the server."
      );
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  function logout() {

    localStorage.removeItem(
      "adminLoggedIn"
    );

    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "adminUsername"
    );

    setIsAuthenticated(false);

    router.replace(
      "/admin/login"
    );
  }

  // =========================================================
  // WAIT FOR LOGIN CHECK
  // =========================================================

  if (!isAuthenticated) {

    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <p className="text-gray-700">
          Checking admin access...
        </p>

      </main>
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading && !event) {

    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <p className="text-lg text-gray-800">
          Loading dashboard...
        </p>

      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !event) {

    return (
      <main className="min-h-screen bg-gray-100 p-8">

        <div className="max-w-4xl mx-auto text-center">

          <p className="text-red-500 text-lg">
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadDashboard
            }
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Retry
          </button>

        </div>

      </main>
    );
  }

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalSeats =
    event?.seats.length || 0;

  const bookedSeats =
    event?.seats.filter(
      (seat) =>
        seat.is_booked
    ).length || 0;

  const blockedSeats =
    event?.seats.filter(
      (seat) =>
        seat.is_blocked
    ).length || 0;

  const availableSeats =
    totalSeats -
    bookedSeats -
    blockedSeats;

  const currentEventBookings =
    bookings.filter(
      (booking) =>
        booking.event_id ===
        selectedEventId
    );

  const filteredBookings =
    currentEventBookings.filter(
      (booking) => {

        const searchText =
          search
            .toLowerCase()
            .trim();

        if (!searchText) {
          return true;
        }

        return (
          booking.name
            .toLowerCase()
            .includes(
              searchText
            ) ||

          booking.email
            .toLowerCase()
            .includes(
              searchText
            ) ||

          String(
            booking.booking_id
          ).includes(
            searchText
          )
        );
      }
    );

  const totalBookings =
    currentEventBookings.length;

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>

              <p className="text-gray-600 mt-2">
                Manage your events and bookings
              </p>

            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={
                  loadDashboard
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
              >
                Refresh Dashboard
              </button>

              <button
                type="button"
                onClick={
                  logout
                }
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-lg font-semibold"
              >
                LOGOUT
              </button>

            </div>

          </div>

        </div>

        {/* EVENT SELECTOR */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <label className="block text-lg font-bold text-gray-900 mb-3">
            Select Event
          </label>

          <select
            value={
              selectedEventId ??
              ""
            }
            onChange={(e) =>
              handleEventChange(
                Number(
                  e.target.value
                )
              )
            }
            className="w-full md:w-1/2 border border-gray-300 rounded-lg p-3 text-gray-900"
          >

            {events.length ===
            0 ? (

              <option value="">
                No events available
              </option>

            ) : (

              events.map(
                (item) => (

                  <option
                    key={
                      item.event_id
                    }
                    value={
                      item.event_id
                    }
                  >
                    {item.name} —
                    Event #
                    {
                      item.event_id
                    }
                  </option>

                )
              )

            )}

          </select>

          {event && (
            <p className="text-gray-500 text-sm mt-3">
              {event.event_name} •{" "}
              {event.total_seats} seats
            </p>
          )}

        </div>

        {/* CREATE EVENT */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Create New Event
          </h2>

          <p className="text-gray-500 text-sm mb-5">
            Create an event and automatically generate its seats.
          </p>

          <form
            id="create-event-form"
            onSubmit={
              async (e) => {

                e.preventDefault();

                const form =
                  e.currentTarget;

                const formData =
                  new FormData(
                    form
                  );

                const name =
                  String(
                    formData.get(
                      "name"
                    ) || ""
                  ).trim();

                const eventDate =
                  String(
                    formData.get(
                      "eventDate"
                    ) || ""
                  );

                const rows =
                  Number(
                    formData.get(
                      "rows"
                    )
                  );

                const columns =
                  Number(
                    formData.get(
                      "columns"
                    )
                  );

                if (
                  !name ||
                  !eventDate ||
                  !rows ||
                  !columns
                ) {

                  alert(
                    "Please fill all fields."
                  );

                  return;
                }

                await createEvent({
                  name,
                  eventDate,
                  rows,
                  columns,
                });
              }
            }
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>

                <input
                  name="name"
                  type="text"
                  placeholder="Tech Fest 2026"
                  className="w-full border border-gray-300 rounded-lg p-3"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date
                </label>

                <input
                  name="eventDate"
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-3"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rows
                </label>

                <input
                  name="rows"
                  type="number"
                  min="1"
                  placeholder="5"
                  className="w-full border border-gray-300 rounded-lg p-3"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Columns
                </label>

                <input
                  name="columns"
                  type="number"
                  min="1"
                  placeholder="10"
                  className="w-full border border-gray-300 rounded-lg p-3"
                />

              </div>

            </div>

            <button
              type="submit"
              className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              CREATE EVENT
            </button>

          </form>

        </div>

        {/* STATISTICS */}

        {event && (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">

              <p className="text-gray-500">
                Total Seats
              </p>

              <p className="text-3xl font-bold text-blue-600 mt-2">
                {totalSeats}
              </p>

            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">

              <p className="text-gray-500">
                Available
              </p>

              <p className="text-3xl font-bold text-green-600 mt-2">
                {availableSeats}
              </p>

            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">

              <p className="text-gray-500">
                Booked
              </p>

              <p className="text-3xl font-bold text-red-600 mt-2">
                {bookedSeats}
              </p>

            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-gray-500">

              <p className="text-gray-500">
                Blocked
              </p>

              <p className="text-3xl font-bold text-gray-600 mt-2">
                {blockedSeats}
              </p>

            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">

              <p className="text-gray-500">
                Bookings
              </p>

              <p className="text-3xl font-bold text-purple-600 mt-2">
                {totalBookings}
              </p>

            </div>

          </div>
        )}

        {/* EVENT SUMMARY */}

        {event && (

          <div className="bg-white rounded-xl shadow p-6 mb-8">

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Event Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div className="bg-gray-50 rounded-lg p-4">

                <p className="text-gray-500 text-sm">
                  Event ID
                </p>

                <p className="font-bold text-gray-900 mt-1">
                  {event.event_id}
                </p>

              </div>

              <div className="bg-gray-50 rounded-lg p-4">

                <p className="text-gray-500 text-sm">
                  Event Name
                </p>

                <p className="font-bold text-gray-900 mt-1">
                  {event.event_name}
                </p>

              </div>

              <div className="bg-gray-50 rounded-lg p-4">

                <p className="text-gray-500 text-sm">
                  Total Seats
                </p>

                <p className="font-bold text-gray-900 mt-1">
                  {totalSeats}
                </p>

              </div>

              <div className="bg-gray-50 rounded-lg p-4">

                <p className="text-gray-500 text-sm">
                  Occupancy
                </p>

                <p className="font-bold text-gray-900 mt-1">

                  {totalSeats === 0
                    ? 0
                    : Math.round(
                        (bookedSeats /
                          totalSeats) *
                          100
                      )}

                  %

                </p>

              </div>

            </div>

          </div>
        )}

        {/* SEAT STATUS */}

        {event && (

          <div className="bg-white rounded-xl shadow p-6 mb-8">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  Seat Status
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Click an available or blocked seat to change its status.
                </p>

              </div>

              <div className="flex flex-wrap gap-4 text-sm">

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Available
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Booked
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-500" />
                  Blocked
                </div>

              </div>

            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">

              {event.seats.map(
                (seat) => {

                  let seatClass =
                    "bg-green-500 hover:bg-green-600 cursor-pointer";

                  if (
                    seat.is_booked
                  ) {

                    seatClass =
                      "bg-red-500 cursor-not-allowed";

                  } else if (
                    seat.is_blocked
                  ) {

                    seatClass =
                      "bg-gray-500 hover:bg-gray-600 cursor-pointer";
                  }

                  return (

                    <button
                      key={
                        seat.id
                      }
                      type="button"
                      disabled={
                        seat.is_booked
                      }
                      onClick={() =>
                        toggleSeatBlock(
                          seat
                        )
                      }
                      title={
                        seat.is_booked
                          ? "Booked seat"
                          : seat.is_blocked
                          ? "Click to unblock seat"
                          : "Click to block seat"
                      }
                      className={`h-10 rounded-md flex items-center justify-center text-xs font-semibold text-white transition ${seatClass}`}
                    >

                      {seat.row}-
                      {seat.column}

                    </button>

                  );

                }
              )}

            </div>

          </div>
        )}

        {/* BOOKINGS */}

        <div className="bg-white rounded-xl shadow overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              All Bookings
            </h2>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by name, email, or booking ID..."
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900"
            />

            <p className="text-gray-500 text-sm mt-2">
              Showing bookings for the selected event
            </p>

          </div>

          {filteredBookings.length ===
          0 ? (

            <div className="p-10 text-center">

              <p className="text-gray-500">

                {search.trim()
                  ? "No bookings match your search."
                  : "No bookings found for this event."}

              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="text-left p-4 text-gray-700">
                      Booking ID
                    </th>

                    <th className="text-left p-4 text-gray-700">
                      Name
                    </th>

                    <th className="text-left p-4 text-gray-700">
                      Email
                    </th>

                    <th className="text-left p-4 text-gray-700">
                      Seats
                    </th>

                    <th className="text-left p-4 text-gray-700">
                      Total
                    </th>

                    <th className="text-left p-4 text-gray-700">
                      Booked At
                    </th>

                    <th className="text-left p-4 text-gray-700">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredBookings.map(
                    (booking) => (

                      <tr
                        key={
                          booking.booking_id
                        }
                        className="border-t hover:bg-gray-50"
                      >

                        <td className="p-4 font-semibold text-gray-900">
                          #
                          {
                            booking.booking_id
                          }
                        </td>

                        <td className="p-4 text-gray-800">
                          {booking.name}
                        </td>

                        <td className="p-4 text-gray-800">
                          {booking.email}
                        </td>

                        <td className="p-4">

                          <div className="flex flex-wrap gap-2">

                            {booking.seats.map(
                              (seat) => (

                                <span
                                  key={
                                    seat.seat_id
                                  }
                                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
                                >
                                  {seat.row}-
                                  {
                                    seat.column
                                  }
                                </span>

                              )
                            )}

                          </div>

                        </td>

                        <td className="p-4 font-semibold text-gray-900">
                          {
                            booking.total_seats
                          }
                        </td>

                        <td className="p-4 text-gray-700 text-sm">
                          {new Date(
                            booking.created_at
                          ).toLocaleString()}
                        </td>

                        <td className="p-4">

                          <button
                            type="button"
                            onClick={() =>
                              cancelBooking(
                                booking.booking_id
                              )
                            }
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                          >
                            Cancel
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}