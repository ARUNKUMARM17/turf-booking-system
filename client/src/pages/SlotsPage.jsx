import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const SlotsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { date } = location.state || {};
  const [bookedSlots, setBookedSlots] = useState(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedHours, setSelectedHours] = useState([]);
  const [error, setError] = useState('');
  const [activeTimeBlock, setActiveTimeBlock] = useState('all');
  
  // Determine if the selected date is a weekend
  const isWeekend = date ? [0, 6].includes(new Date(date).getDay()) : false;
  
  // Set hourly rate based on weekday/weekend
  const hourlyRate = isWeekend ? 1000 : 800;

  useEffect(() => {
    if (!date || !user) {
      navigate('/');
      return;
    }

    const formattedDate = new Date(date).toLocaleDateString('en-US');
    const bookingRef = doc(db, 'bookings', formattedDate);

    const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
      if (docSnap.exists()) {
        setBookedSlots(new Set(docSnap.data().bookedSlots || []));
      }
    });

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [date, navigate, user]);

  const isPastTime = (timeStr) => {
    if (!timeStr) return true;
    const match = timeStr.match(/(\d+):(\d+) (AM|PM)/);
    if (!match) return true;

    const [hour, minutes, ampm] = match.slice(1);
    let hours = parseInt(hour, 10);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const selectedDate = new Date(date);
    selectedDate.setHours(hours, parseInt(minutes, 10), 0, 0);

    return selectedDate < currentTime;
  };

  const getHourValue = (timeStr) => {
    const match = timeStr.match(/(\d+):(\d+) (AM|PM)/);
    if (!match) return 0;
    
    const [hour, minutes, ampm] = match.slice(1);
    let hours = parseInt(hour, 10);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    return hours + (parseInt(minutes, 10) / 60);
  };

  const isSlotBooked = (slot) => {
    return Array.from(bookedSlots).some(bookedSlot => {
      const bookedHour = getHourValue(bookedSlot);
      const slotHour = getHourValue(slot);
      return Math.abs(bookedHour - slotHour) < 0.5; // Within 30 minutes
    });
  };

  const formatTime = (hour, minute) => {
    const h = hour % 12 || 12;
    const m = minute === 0 ? '00' : '30';
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}:${m} ${ampm}`;
  };

  const generateTimeSlots = () => {
    // Generate time slots for the entire day in 30-minute increments
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = formatTime(hour, minute);
        const isPast = isPastTime(time);
        const isBooked = isSlotBooked(time);
        
        slots.push({
          time,
          hour,
          minute,
          isPast,
          isBooked,
          isSelectable: !isPast && !isBooked,
          timeBlock: getTimeBlock(hour)
        });
      }
    }
    return slots;
  };
  
  const getTimeBlock = (hour) => {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };
  
  const handleSlotSelection = (slot) => {
    if (!slot.isSelectable) return;
    
    if (selectedHours.length === 0) {
      // First selection - set as start time
      setStartTime(slot.time);
      setSelectedHours([getHourValue(slot.time)]);
      setEndTime('');
    } else if (selectedHours.length === 1) {
      // Second selection - determine if it should be start or end time
      const existingValue = selectedHours[0];
      const newValue = getHourValue(slot.time);
      
      if (newValue < existingValue) {
        // If the new selection is earlier, make it the start time
        setStartTime(slot.time);
        setEndTime(formatTime(Math.floor(existingValue), (existingValue % 1) * 60));
        
        // Generate range
        const range = [];
        for (let h = newValue; h <= existingValue; h += 0.5) {
          range.push(h);
        }
        setSelectedHours(range);
      } else {
        // If the new selection is later, make it the end time
        setEndTime(slot.time);
        
        // Generate range
        const range = [];
        for (let h = existingValue; h <= newValue; h += 0.5) {
          range.push(h);
        }
        setSelectedHours(range);
      }
    } else {
      // Reset and start over if already have a range
      setStartTime(slot.time);
      setSelectedHours([getHourValue(slot.time)]);
      setEndTime('');
    }
    
    setError('');
  };
  
  // Check if the time range is valid
  useEffect(() => {
    if (startTime && endTime) {
      // Check if all slots in the range are available
      const start = getHourValue(startTime);
      const end = getHourValue(endTime);
      
      for (let h = start; h < end; h += 0.5) {
        const time = formatTime(Math.floor(h), (h % 1) * 60);
        if (isSlotBooked(time)) {
          setError('Your selected time range contains booked slots.');
          return;
        }
      }
      
      if (start >= end) {
        setError('End time must be after start time.');
      } else {
        setError('');
      }
    }
  }, [startTime, endTime]);

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    
    const start = getHourValue(startTime);
    const end = getHourValue(endTime);
    
    return end - start;
  };

  const handleBooking = () => {
    if (!startTime || !endTime) {
      setError('Please select both start and end times.');
      return;
    }
    
    if (error) {
      return;
    }
    
    const duration = calculateDuration();
    const totalAmount = Math.round(duration * hourlyRate);
    const initialPayment = 100; // Fixed initial payment amount
    
    navigate('/payment', { 
      state: { 
        date, 
        startTime, 
        endTime, 
        userEmail: user.email,
        hourlyRate,
        totalAmount,
        initialPayment,
        duration
      } 
    });
  };

  const timeSlots = generateTimeSlots();
  const duration = calculateDuration();
  
  // Filter time slots based on active time block
  const filteredTimeSlots = activeTimeBlock === 'all' 
    ? timeSlots 
    : timeSlots.filter(slot => slot.timeBlock === activeTimeBlock);
  
  // Group filtered time slots by hour for grid display
  const groupedTimeSlots = {};
  filteredTimeSlots.forEach(slot => {
    const hour = slot.hour;
    if (!groupedTimeSlots[hour]) {
      groupedTimeSlots[hour] = [];
    }
    groupedTimeSlots[hour].push(slot);
  });
  
  // Time block options
  const timeBlocks = [
    { id: 'all', label: 'All Times' },
    { id: 'morning', label: 'Morning (6AM-12PM)' },
    { id: 'afternoon', label: 'Afternoon (12PM-5PM)' },
    { id: 'evening', label: 'Evening (5PM-10PM)' },
    { id: 'night', label: 'Night (10PM-6AM)' }
  ];

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Book Your Slot</h1>
        <div className="bg-blue-50 p-3 rounded-lg mb-6 border border-blue-200">
          <p className="text-lg font-medium mb-1">Date: <span className="font-bold">{new Date(date).toDateString()}</span></p>
          <p className="text-md text-blue-800">
            Rate: <span className="font-bold">₹{hourlyRate}</span> per hour {isWeekend ? "(Weekend)" : "(Weekday)"}
          </p>
        </div>
        
        <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-400 rounded-full mr-2"></div>
              <span className="text-sm">Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>
              <span className="text-sm">Past</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm">Selected</span>
            </div>
          </div>
          
          <div className="mb-2 text-center">
            <p className="text-sm font-medium">Tap to select start time, then tap another slot to select end time</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Select Your Time</h2>
          
          {/* Time Block Selector */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {timeBlocks.map(block => (
                <button
                  key={block.id}
                  onClick={() => setActiveTimeBlock(block.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTimeBlock === block.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {block.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Time Grid */}
          <div className="mb-6">
            {Object.keys(groupedTimeSlots).length > 0 ? (
              Object.keys(groupedTimeSlots).map(hour => {
                const hourInt = parseInt(hour, 10);
                const displayHour = hourInt % 12 || 12;
                const ampm = hourInt < 12 ? 'AM' : 'PM';
                
                return (
                  <div key={hour} className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">{displayHour} {ampm}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {groupedTimeSlots[hour].map((slot, index) => {
                        const slotValue = getHourValue(slot.time);
                        const isSelected = selectedHours.includes(slotValue);
                        
                        let bgColor = "bg-blue-500";
                        let textColor = "text-white";
                        let cursor = "cursor-pointer";
                        
                        if (slot.isPast) {
                          bgColor = "bg-gray-300";
                          textColor = "text-gray-500";
                          cursor = "cursor-not-allowed";
                        } else if (slot.isBooked) {
                          bgColor = "bg-red-400";
                          textColor = "text-white";
                          cursor = "cursor-not-allowed";
                        } else if (isSelected) {
                          bgColor = "bg-green-400";
                          textColor = "text-white";
                        }
                        
                        // Special styling for start and end times
                        if (slot.time === startTime) {
                          bgColor = "bg-green-600";
                        }
                        if (slot.time === endTime) {
                          bgColor = "bg-green-600";
                        }
                        
                        return (
                          <div 
                            key={index}
                            onClick={() => handleSlotSelection(slot)}
                            className={`${bgColor} ${textColor} ${cursor} rounded-lg p-2 text-center transition-all duration-200 hover:opacity-90 flex items-center justify-center`}
                          >
                            {slot.time}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-4 text-gray-500">
                No available time slots in this period
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p>{error}</p>
            </div>
          )}
          
          {startTime && endTime && !error && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex flex-col md:flex-row md:justify-between">
                <div className="mb-2 md:mb-0">
                  <p className="text-sm text-gray-600">Selected Time</p>
                  <p className="text-lg font-semibold">{startTime} - {endTime}</p>
                </div>
                <div className="mb-2 md:mb-0">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold">{duration.toFixed(1)} hours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className="text-lg font-semibold text-green-700">₹{Math.round(duration * hourlyRate)}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p className="text-sm text-gray-600">Initial payment: <span className="font-medium">₹100</span></p>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleBooking}
            disabled={!startTime || !endTime || !!error}
            className={`w-full py-4 rounded-lg font-medium text-white ${
              startTime && endTime && !error ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            } transition-colors duration-200 shadow-md`}
          >
            {startTime && endTime && !error ? 'Proceed to Payment' : 'Select Time Slots'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotsPage;