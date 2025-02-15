import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from "react-icons/md";
import { Link } from "react-router-dom";

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const HomePage = () => {
  const navigate = useNavigate();
  const today = new Date();

  return (
    <div>
    <div className="flex items-center justify-between text-purple-500 font-bold mt-5 p-1">
    <Link to={"/register"}>
      <div className="cursor-pointer flex items-center text-xs">
        <MdArrowBack />
        Back to register
      </div>
    </Link>


  </div>

    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-300 to-purple-400 p-6">

      <h1 className="text-4xl font-bold mb-4">Book Your Turf</h1>
      <Calendar
        minDate={today}
        onClickDay={(date) => navigate('/slots', { state: { date } })}
        className="border border-gray-400 rounded-lg shadow-lg p-2"
      />
    </div>
    </div>
  );
};
export default HomePage;

