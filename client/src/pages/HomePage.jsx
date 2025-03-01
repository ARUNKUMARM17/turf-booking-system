import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdLogout } from "react-icons/md";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const HomePage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    // Check if user is logged in, otherwise redirect to login
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login'); // Redirect if not logged in
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("user"); // Clear session storage
      navigate('/login'); // Redirect to login after logout
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    navigate('/slots', { state: { date } });
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-blue-600 p-6 text-white">
      {/* Top Navigation */}
      <div className="absolute top-5 left-5">
        <button
          onClick={() => navigate('/register')}
          className="flex items-center text-sm font-semibold bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-200 transition-all"
        >
          <MdArrowBack className="mr-1" /> Register
        </button>
      </div>

      <div className="absolute top-5 right-5">
        <button
          onClick={handleLogout}
          className="flex items-center text-sm font-semibold bg-red-500 px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition-all"
        >
          <MdLogout className="mr-1" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <h1 className="text-4xl font-bold my-6">Book Your Turf</h1>
      <div className="bg-white p-6 rounded-lg shadow-xl text-gray-800">
        <Calendar
          minDate={today}
          tileDisabled={({ date }) => date < today}
          onClickDay={handleDateChange}
          className="border border-gray-300 rounded-lg shadow-md p-4"
        />
      </div>
    </div>
  );
};

export default HomePage;
