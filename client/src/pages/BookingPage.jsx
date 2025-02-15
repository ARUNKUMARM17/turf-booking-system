import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const BookingPage = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const selectedDate = location.state?.selectedDate;
  const selectedSlot = location.state?.slot;

  const handleConfirmBooking = () => {
    const newBooking = { date: selectedDate.toDateString(), slot: selectedSlot };
    setBookings([...bookings, newBooking]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-4">
      <h1 className="text-3xl font-bold mb-4">Booking Confirmation</h1>
      {selectedDate && selectedSlot ? (
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <p className="text-lg">Date: {selectedDate.toDateString()}</p>
          <p className="text-lg">Slot: {selectedSlot.time}</p>
          <p className="text-lg">Price: ₹{selectedSlot.price}</p>
          <button
            onClick={handleConfirmBooking}
            className="bg-green-500 text-white p-2 mt-4 rounded-lg"
          >
            Confirm Booking
          </button>
        </div>
      ) : (
        <p className="text-lg text-red-500">No booking details available.</p>
      )}

      <h2 className="text-2xl font-bold mt-6">Previous Bookings</h2>
      {bookings.length > 0 ? (
        <ul className="bg-white p-4 rounded-lg shadow-lg mt-2">
          {bookings.map((booking, index) => (
            <li key={index} className="text-lg">{`${booking.date} - ${booking.slot.time} - ₹${booking.slot.price}`}</li>
          ))}
        </ul>
      ) : (
        <p className="text-lg">No previous bookings.</p>
      )}
    </div>
  );
};

export default BookingPage;
