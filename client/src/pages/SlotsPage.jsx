import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SlotsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to Home if no date is selected
  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }
  }, [location, navigate]);

  if (!location.state) return null; // Prevent further execution if state is missing

  const { date } = location.state;
  const slots = ['Morning', 'Afternoon', 'Evening', 'Night'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Available Slots for {new Date(date).toDateString()}</h1>
      <div className="grid grid-cols-2 gap-4">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => navigate('/timings', { state: { date, slot } })}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition"
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlotsPage;
