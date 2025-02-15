import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const TimingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { date, slot, userEmail } = location.state || {};
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedSlots, setBookedSlots] = useState(new Set());

  useEffect(() => {
    if (!date || !slot) {
      navigate("/");
      return;
    }

    const formattedDate = new Date(date).toLocaleDateString("en-US");

    const fetchBookedSlots = async () => {
      const bookingRef = doc(db, "bookings", `${formattedDate}_${slot.toLowerCase().trim()}`);
      const docSnap = await getDoc(bookingRef);

      if (docSnap.exists()) {
        setBookedSlots(new Set(docSnap.data().bookedTimes || []));
      }
    };

    fetchBookedSlots();
  }, [date, slot, navigate]);

  useEffect(() => {
    const slots = {
      Morning: ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"],
      Afternoon: ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"],
      Evening: ["04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"],
    };

    setAvailableTimes(slots[slot] || []);
  }, [slot]);

  const handleSlotSelect = (time) => {
    if (bookedSlots.has(time)) return;

    const formattedDate = new Date(date).toLocaleDateString("en-US");
    navigate("/payment", { state: { date: formattedDate, slot, time, userEmail } });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Select Your Time Slot</h1>
      <p className="text-lg mb-2">Date: {new Date(date).toLocaleDateString("en-US")}</p>
      <p className="text-lg mb-4">Slot: {slot}</p>

      {availableTimes.length === 0 ? (
        <p className="text-red-500">No available timings for this slot.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {availableTimes.map((time) => (
            <button
              key={time}
              onClick={() => handleSlotSelect(time)}
              className={`px-4 py-2 rounded-lg text-white font-semibold ${
                bookedSlots.has(time) ? "bg-red-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-700"
              }`}
              disabled={bookedSlots.has(time)}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimingsPage;
