import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdLogout } from "react-icons/md";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const HomePage = () => {
  const navigate = useNavigate();
  const auth = getAuth();

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

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-300 to-purple-400 p-6">
      {/* Top Navigation */}
      <div className="absolute top-5 left-5">
        {/* Back to Register Button */}
        <button
          onClick={() => navigate('/register')}
          className="flex items-center text-sm font-semibold text-white bg-purple-600 px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 transition-all"
        >
          <MdArrowBack className="mr-1" /> Register
        </button>
      </div>

      <div className="absolute top-5 right-5">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center text-sm font-semibold text-white bg-red-500 px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition-all"
        >
          <MdLogout className="mr-1" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <h1 className="text-4xl font-bold text-white my-6">Book Your Turf</h1>
      <Calendar
        minDate={today}
        onClickDay={(date) => navigate('/slots', { state: { date } })}
        className="border border-gray-400 rounded-lg shadow-lg p-2 bg-white"
      />
    </div>
  );
};

export default HomePage;
