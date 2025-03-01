import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { 
    date, 
    startTime, 
    endTime, 
    userEmail, 
    hourlyRate, 
    initialPayment, 
    totalAmount,
    duration 
  } = location.state || {};
  
  const [paymentMethod, setPaymentMethod] = useState('paytm');
  const [loading, setLoading] = useState(false);
  const [showPaytmInfo, setShowPaytmInfo] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  
  // Replace with your actual Paytm ID
  const paytmId = "6374975557@ptsbi";
  
  // Check if we have all the required data
  if (!date || !startTime || !endTime || !user) {
    navigate('/');
    return null;
  }

  const formattedDate = new Date(date).toLocaleDateString('en-US');
  const remainingAmount = totalAmount - initialPayment;

  const handleInitiatePayment = () => {
    setShowPaytmInfo(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentReference.trim()) {
      alert("Please enter the payment reference number from your Paytm transaction.");
      return;
    }
    
    setLoading(true);
    try {
      // First, check if this slot is already booked (to prevent double booking)
      const bookingRef = doc(db, 'bookings', formattedDate);
      const bookingSnap = await getDoc(bookingRef);
      
      // Calculate all time slots that would be booked in this range
      const slots = getTimeSlotsBetween(startTime, endTime);
      
      if (bookingSnap.exists()) {
        const bookedSlots = bookingSnap.data().bookedSlots || [];
        
        // Check if any slot in our range is already booked
        for (const slot of slots) {
          if (bookedSlots.includes(slot)) {
            alert('Sorry, this time slot was just booked by someone else.');
            navigate('/slots', { state: { date } });
            return;
          }
        }
      }

      // Update bookings document to mark all slots in the range as booked
      await updateDoc(bookingRef, {
        bookedSlots: arrayUnion(...slots)
      }).catch(() => {
        // If document doesn't exist yet, create it
        return setDoc(bookingRef, {
          bookedSlots: slots
        });
      });

      // Save booking details
      const bookingId = Date.now().toString();
      const bookingDetails = {
        id: bookingId,
        date: formattedDate,
        startTime,
        endTime,
        userEmail,
        userId: user.uid,
        totalAmount,
        initialPayment,
        remainingAmount,
        paymentMethod,
        paymentReference,
        createdAt: new Date().toISOString(),
        status: 'confirmed',
        paymentStatus: 'partial', // Since only initial payment is made
        duration
      };

      // Save to user's bookings collection
      await setDoc(doc(db, 'users', user.uid, 'bookings', bookingId), bookingDetails);
      
      // Also save to a global bookings collection for admin access
      await setDoc(doc(db, 'allBookings', bookingId), bookingDetails);

      // Navigate to confirmation page
      navigate('/booking', { state: { booking: bookingDetails } });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment confirmation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get all time slots between start and end time
  const getTimeSlotsBetween = (start, end) => {
    const slots = [];
    const getHourValue = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+) (AM|PM)/);
      if (!match) return 0;
      
      const [hour, minutes, ampm] = match.slice(1);
      let hours = parseInt(hour, 10);
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      return hours + (parseInt(minutes, 10) / 60);
    };
    
    const startHour = getHourValue(start);
    const endHour = getHourValue(end);
    
    // Get all available time slots
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) { // Half-hour increments
        const hour = i % 12 || 12;
        const minutes = j === 0 ? '00' : j.toString();
        const ampm = i < 12 ? 'AM' : 'PM';
        const timeString = `${hour}:${minutes} ${ampm}`;
        
        const currentHour = getHourValue(timeString);
        if (currentHour >= startHour && currentHour < endHour) {
          slots.push(timeString);
        }
      }
    }
    
    return slots;
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Payment</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Booking Details</h2>
          <div className="space-y-2 mb-4">
            <p><span className="font-medium">Date:</span> {new Date(date).toDateString()}</p>
            <p><span className="font-medium">Time:</span> {startTime} - {endTime}</p>
            <p><span className="font-medium">Duration:</span> {duration.toFixed(1)} hours</p>
            <p><span className="font-medium">Total Amount:</span> ₹{totalAmount}</p>
            <div className="border-t border-b py-2 my-2">
              <p className="font-medium text-green-700">Initial Payment: ₹{initialPayment}</p>
              <p className="text-sm text-gray-600">Remaining (to be paid later): ₹{remainingAmount}</p>
            </div>
          </div>
        </div>
        
        {!showPaytmInfo ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Payment Method</h2>
            
            <div className="space-y-3 mb-4">
              <div 
                className={`border rounded-lg p-3 flex items-center cursor-pointer ${
                  paymentMethod === 'paytm' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onClick={() => setPaymentMethod('paytm')}
              >
                <div className="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center
                              border-blue-500">
                  {paymentMethod === 'paytm' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Paytm</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="font-bold text-blue-800">P</span>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-3 flex items-center cursor-pointer ${
                  paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onClick={() => setPaymentMethod('upi')}
              >
                <div className="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center
                              border-blue-500">
                  {paymentMethod === 'upi' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">UPI / Google Pay</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="font-bold text-green-800">UPI</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleInitiatePayment}
              className="w-full py-3 rounded-md font-medium text-white text-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Make Payment</h2>
            
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Payment Instructions:</h3>
              <ol className="list-decimal pl-5 text-sm text-gray-800 space-y-2">
                <li>Open your {paymentMethod === 'paytm' ? 'Paytm' : 'UPI'} app</li>
                <li>Send ₹{initialPayment} to: <span className="font-bold">{paytmId}</span></li>
                <li>Note the reference/transaction ID from your payment</li>
                <li>Enter the reference ID below and click "Confirm Payment"</li>
              </ol>
            </div>
            
            <div className="mb-6 p-4 bg-gray-100 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium">Pay to:</p>
                <p className="text-xl font-bold text-blue-700">{paytmId}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Amount:</p>
                <p className="text-xl font-bold text-green-700">₹{initialPayment}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Enter Payment Reference ID</label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., PTM12345678"
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowPaytmInfo(false)}
                className="flex-1 py-3 rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
              >
                Back
              </button>
              
              <button 
                onClick={handleConfirmPayment}
                disabled={loading || !paymentReference.trim()}
                className={`flex-1 py-3 rounded-md font-medium text-white ${
                  loading || !paymentReference.trim() ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                } transition-colors duration-200`}
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        )}
        
        <p className="text-center text-sm text-gray-600">
          Note: This is only an initial payment of ₹{initialPayment}. The remaining amount of ₹{remainingAmount} will be collected at the venue.
        </p>
      </div>
    </div>
  );
};
export default PaymentPage;
// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { doc, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
// import { db, auth } from './firebase';
// import axios from 'axios';

// const PaymentPage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { 
//     date, 
//     startTime, 
//     endTime, 
//     userEmail, 
//     hourlyRate, 
//     initialPayment, 
//     totalAmount,
//     duration 
//   } = location.state || {};
  
//   const [paymentMethod, setPaymentMethod] = useState('card');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   // Payment form fields
//   const [cardNumber, setCardNumber] = useState('');
//   const [cardExpiry, setCardExpiry] = useState('');
//   const [cardCvv, setCardCvv] = useState('');
//   const [cardName, setCardName] = useState('');
//   const [upiId, setUpiId] = useState('');
  
//   // Razorpay integration
//   const [razorpayOrder, setRazorpayOrder] = useState(null);
  
//   useEffect(() => {
//     // Redirect if required data is missing
//     if (!date || !startTime || !endTime || !user) {
//       navigate('/', { replace: true });
//       return;
//     }
    
//     // Load the Razorpay script
//     const script = document.createElement('script');
//     script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//     script.async = true;
//     document.body.appendChild(script);
    
//     // Create a Razorpay order
//     const createRazorpayOrder = async () => {
//       try {
//         setLoading(true);
//         // This would normally be a call to your backend API
//         const response = await axios.post('/api/create-razorpay-order', {
//           amount: initialPayment * 100, // Razorpay expects amount in paise
//           currency: 'INR',
//           receipt: `booking_${Date.now()}`
//         });
        
//         setRazorpayOrder(response.data);
//         setLoading(false);
//       } catch (err) {
//         console.error('Failed to create order:', err);
//         setError('Failed to initialize payment. Please try again.');
//         setLoading(false);
//       }
//     };
    
//     createRazorpayOrder();
    
//     return () => {
//       // Clean up the script when component unmounts
//       const razorpayScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
//       if (razorpayScript) {
//         document.body.removeChild(razorpayScript);
//       }
//     };
//   }, [date, startTime, endTime, user, navigate, initialPayment]);

//   // If data is missing, don't render the component
//   if (!date || !startTime || !endTime || !user) {
//     return <div className="p-6 text-center">Redirecting to home page...</div>;
//   }

//   const formattedDate = new Date(date).toLocaleDateString('en-US');
//   const remainingAmount = totalAmount - initialPayment;

//   // Format card number with spaces
//   const formatCardNumber = (value) => {
//     const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
//     const matches = v.match(/\d{4,16}/g);
//     const match = matches && matches[0] || '';
//     const parts = [];
    
//     for (let i = 0, len = match.length; i < len; i += 4) {
//       parts.push(match.substring(i, i + 4));
//     }
    
//     if (parts.length) {
//       return parts.join(' ');
//     } else {
//       return value;
//     }
//   };
  
//   // Format card expiry
//   const formatExpiry = (value) => {
//     const expiry = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
//     if (expiry.length > 2) {
//       return `${expiry.substring(0, 2)}/${expiry.substring(2, 4)}`;
//     }
//     return expiry;
//   };
  
//   const handleCardNumberChange = (e) => {
//     const formattedValue = formatCardNumber(e.target.value);
//     setCardNumber(formattedValue.substring(0, 19)); // limit length
//   };
  
//   const handleExpiryChange = (e) => {
//     const formattedValue = formatExpiry(e.target.value);
//     setCardExpiry(formattedValue.substring(0, 5)); // limit length
//   };
  
//   const handleCvvChange = (e) => {
//     const value = e.target.value.replace(/\D/g, '');
//     setCardCvv(value.substring(0, 3)); // limit length
//   };
  
//   const openRazorpayCheckout = () => {
//     if (!razorpayOrder) {
//       setError('Payment system initializing. Please try again in a moment.');
//       return;
//     }
    
//     const options = {
//       key: 'rzp_test_YOUR_KEY_HERE', // Replace with your Razorpay Key ID
//       amount: razorpayOrder.amount,
//       currency: razorpayOrder.currency,
//       name: 'Your Business Name',
//       description: `Booking for ${formattedDate}`,
//       order_id: razorpayOrder.id,
//       handler: async function (response) {
//         // This function runs after successful payment
//         await handleSuccessfulPayment(response);
//       },
//       prefill: {
//         name: user.displayName || '',
//         email: user.email || '',
//         contact: '',
//       },
//       notes: {
//         bookingDate: formattedDate,
//         startTime,
//         endTime,
//         duration
//       },
//       theme: {
//         color: '#3399cc',
//       },
//     };
    
//     const rzp = new window.Razorpay(options);
//     rzp.open();
//   };
  
//   const handleCardPayment = async () => {
//     // Validate card details
//     if (!cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
//       setError('Please enter a valid 16-digit card number');
//       return;
//     }
    
//     if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
//       setError('Please enter a valid expiry date (MM/YY)');
//       return;
//     }
    
//     if (!cardCvv.match(/^\d{3}$/)) {
//       setError('Please enter a valid 3-digit CVV');
//       return;
//     }
    
//     if (!cardName.trim()) {
//       setError('Please enter the cardholder name');
//       return;
//     }
    
//     setLoading(true);
    
//     try {
//       // In a real application, you would send this data to your payment processor
//       // Here we'll simulate a successful payment after a short delay
      
//       setTimeout(() => {
//         // Simulate response from payment processor
//         const paymentResponse = {
//           id: `pay_${Date.now()}`,
//           status: 'success'
//         };
        
//         handleSuccessfulPayment(paymentResponse);
//       }, 2000);
//     } catch (error) {
//       console.error('Payment processing error:', error);
//       setError('Payment failed. Please check your card details and try again.');
//       setLoading(false);
//     }
//   };
  
//   const handleUpiPayment = async () => {
//     if (!upiId.match(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)) {
//       setError('Please enter a valid UPI ID (e.g., yourname@upi)');
//       return;
//     }
    
//     openRazorpayCheckout();
//   };
  
//   const handleSuccessfulPayment = async (paymentResponse) => {
//     try {
//       // Check if slots are still available (to prevent double booking)
//       const bookingRef = doc(db, 'bookings', formattedDate);
//       const bookingSnap = await getDoc(bookingRef);
      
//       // Calculate all time slots that would be booked in this range
//       const slots = getTimeSlotsBetween(startTime, endTime);
      
//       if (bookingSnap.exists()) {
//         const bookedSlots = bookingSnap.data().bookedSlots || [];
        
//         // Check if any slot in our range is already booked
//         const conflictingSlots = slots.filter(slot => bookedSlots.includes(slot));
//         if (conflictingSlots.length > 0) {
//           setError('Sorry, this time slot was just booked by someone else.');
//           navigate('/slots', { state: { date } });
//           return;
//         }
//       }

//       // Update bookings document to mark all slots in the range as booked
//       if (bookingSnap.exists()) {
//         await updateDoc(bookingRef, {
//           bookedSlots: arrayUnion(...slots)
//         });
//       } else {
//         // If document doesn't exist yet, create it
//         await setDoc(bookingRef, {
//           bookedSlots: slots
//         });
//       }

//       // Save booking details
//       const bookingId = `booking_${Date.now()}_${user.uid.substring(0, 5)}`;
//       const bookingDetails = {
//         id: bookingId,
//         date: formattedDate,
//         startTime,
//         endTime,
//         userEmail: userEmail || user.email,
//         userId: user.uid,
//         totalAmount,
//         initialPayment,
//         remainingAmount,
//         paymentMethod,
//         paymentId: paymentResponse.id,
//         paymentStatus: 'completed',
//         createdAt: new Date().toISOString(),
//         status: 'confirmed',
//         duration
//       };

//       // Save to user's bookings collection
//       await setDoc(doc(db, 'users', user.uid, 'bookings', bookingId), bookingDetails);
      
//       // Also save to a global bookings collection for admin access
//       await setDoc(doc(db, 'allBookings', bookingId), bookingDetails);

//       // Navigate to confirmation page
//       navigate('/booking', { state: { booking: bookingDetails } });
//     } catch (error) {
//       console.error('Booking error:', error);
//       setError('Payment was successful, but booking confirmation failed. Please contact support.');
//       setLoading(false);
//     }
//   };
  
//   // Helper function to get all time slots between start and end time
//   const getTimeSlotsBetween = (start, end) => {
//     const slots = [];
//     const getHourValue = (timeStr) => {
//       const match = timeStr.match(/(\d+):(\d+) (AM|PM)/);
//       if (!match) return 0;
      
//       const [hour, minutes, ampm] = match.slice(1);
//       let hours = parseInt(hour, 10);
//       if (ampm === 'PM' && hours !== 12) hours += 12;
//       if (ampm === 'AM' && hours === 12) hours = 0;
      
//       return hours + (parseInt(minutes, 10) / 60);
//     };
    
//     const startHour = getHourValue(start);
//     const endHour = getHourValue(end);
    
//     // Get all available time slots
//     for (let i = 0; i < 24; i++) {
//       for (let j = 0; j < 60; j += 30) { // Half-hour increments
//         const hour = i % 12 || 12;
//         const minutes = j === 0 ? '00' : j.toString();
//         const ampm = i < 12 ? 'AM' : 'PM';
//         const timeString = `${hour}:${minutes} ${ampm}`;
        
//         const currentHour = getHourValue(timeString);
//         if (currentHour >= startHour && currentHour < endHour) {
//           slots.push(timeString);
//         }
//       }
//     }
    
//     return slots;
//   };

//   const handlePaymentSubmit = (e) => {
//     e.preventDefault();
//     setError('');
    
//     if (paymentMethod === 'card') {
//       handleCardPayment();
//     } else if (paymentMethod === 'upi') {
//       handleUpiPayment();
//     } else if (paymentMethod === 'razorpay') {
//       openRazorpayCheckout();
//     }
//   };

//   return (
//     <div className="flex flex-col items-center min-h-screen p-6 bg-gray-100">
//       <div className="w-full max-w-md">
//         <h1 className="text-3xl font-bold text-gray-800 mb-6">Secure Payment</h1>
        
//         <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//           <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Booking Details</h2>
//           <div className="space-y-2 mb-4">
//             <p><span className="font-medium">Date:</span> {new Date(date).toDateString()}</p>
//             <p><span className="font-medium">Time:</span> {startTime} - {endTime}</p>
//             <p><span className="font-medium">Duration:</span> {duration.toFixed(1)} hours</p>
//             <p><span className="font-medium">Total Amount:</span> ₹{totalAmount}</p>
//             <div className="border-t border-b py-2 my-2">
//               <p className="font-medium text-green-700">Initial Payment: ₹{initialPayment}</p>
//               <p className="text-sm text-gray-600">Remaining (to be paid later): ₹{remainingAmount}</p>
//             </div>
//           </div>
//         </div>
        
//         <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//           <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Payment Method</h2>
          
//           <div className="space-y-3 mb-4">
//             <div 
//               className={`border rounded-lg p-3 flex items-center cursor-pointer ${
//                 paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
//               }`}
//               onClick={() => setPaymentMethod('card')}
//             >
//               <div className="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center
//                             border-blue-500">
//                 {paymentMethod === 'card' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
//               </div>
//               <div className="flex-1">
//                 <p className="font-medium">Credit/Debit Card</p>
//               </div>
//               <div className="flex space-x-1">
//                 <div className="w-10 h-6 bg-blue-100 rounded-md flex items-center justify-center">
//                   <span className="text-xs font-bold text-blue-800">Visa</span>
//                 </div>
//                 <div className="w-10 h-6 bg-red-100 rounded-md flex items-center justify-center">
//                   <span className="text-xs font-bold text-red-800">MC</span>
//                 </div>
//               </div>
//             </div>
            
//             <div 
//               className={`border rounded-lg p-3 flex items-center cursor-pointer ${
//                 paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
//               }`}
//               onClick={() => setPaymentMethod('upi')}
//             >
//               <div className="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center
//                             border-blue-500">
//                 {paymentMethod === 'upi' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
//               </div>
//               <div className="flex-1">
//                 <p className="font-medium">UPI</p>
//               </div>
//               <div className="w-12 h-6 bg-green-100 rounded-md flex items-center justify-center">
//                 <span className="text-xs font-bold text-green-800">UPI</span>
//               </div>
//             </div>
            
//             <div 
//               className={`border rounded-lg p-3 flex items-center cursor-pointer ${
//                 paymentMethod === 'razorpay' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
//               }`}
//               onClick={() => setPaymentMethod('razorpay')}
//             >
//               <div className="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center
//                             border-blue-500">
//                 {paymentMethod === 'razorpay' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
//               </div>
//               <div className="flex-1">
//                 <p className="font-medium">Razorpay</p>
//                 <p className="text-xs text-gray-500">(Multiple payment options)</p>
//               </div>
//               <div className="w-16 h-6 bg-blue-100 rounded-md flex items-center justify-center">
//                 <span className="text-xs font-bold text-blue-800">Razorpay</span>
//               </div>
//             </div>
//           </div>
          
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
//               {error}
//             </div>
//           )}
          
//           <form onSubmit={handlePaymentSubmit}>
//             {paymentMethod === 'card' && (
//               <div className="space-y-4 mb-6">
//                 <div>
//                   <label className="block text-gray-700 text-sm font-medium mb-1">Card Number</label>
//                   <input
//                     type="text"
//                     value={cardNumber}
//                     onChange={handleCardNumberChange}
//                     placeholder="1234 5678 9012 3456"
//                     className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   />
//                 </div>
                
//                 <div className="flex space-x-4">
//                   <div className="flex-1">
//                     <label className="block text-gray-700 text-sm font-medium mb-1">Expiry (MM/YY)</label>
//                     <input
//                       type="text"
//                       value={cardExpiry}
//                       onChange={handleExpiryChange}
//                       placeholder="MM/YY"
//                       className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       required
//                     />
//                   </div>
                  
//                   <div className="w-1/3">
//                     <label className="block text-gray-700 text-sm font-medium mb-1">CVV</label>
//                     <input
//                       type="password"
//                       value={cardCvv}
//                       onChange={handleCvvChange}
//                       placeholder="123"
//                       className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       required
//                     />
//                   </div>
//                 </div>
                
//                 <div>
//                   <label className="block text-gray-700 text-sm font-medium mb-1">Cardholder Name</label>
//                   <input
//                     type="text"
//                     value={cardName}
//                     onChange={(e) => setCardName(e.target.value)}
//                     placeholder="John Smith"
//                     className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   />
//                 </div>
//               </div>
//             )}
            
//             {paymentMethod === 'upi' && (
//               <div className="space-y-4 mb-6">
//                 <div>
//                   <label className="block text-gray-700 text-sm font-medium mb-1">UPI ID</label>
//                   <input
//                     type="text"
//                     value={upiId}
//                     onChange={(e) => setUpiId(e.target.value)}
//                     placeholder="yourname@upi"
//                     className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   />
//                 </div>
                
//                 <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//                   <p className="text-sm text-yellow-800">
//                     You will be redirected to your UPI app to complete the payment.
//                   </p>
//                 </div>
//               </div>
//             )}
            
//             {paymentMethod === 'razorpay' && (
//               <div className="space-y-4 mb-6">
//                 <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                   <p className="text-sm text-blue-800">
//                     You will be redirected to Razorpay's secure payment page where you can choose from multiple payment options including cards, UPI, wallets, and net banking.
//                   </p>
//                 </div>
//               </div>
//             )}
            
//             <div className="flex justify-between">
//               <button
//                 type="button"
//                 onClick={() => navigate(-1)}
//                 className="py-3 px-4 rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
//               >
//                 Back
//               </button>
              
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`py-3 px-8 rounded-md font-medium text-white ${
//                   loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
//                 } transition-colors duration-200`}
//               >
//                 {loading ? 'Processing...' : `Pay ₹${initialPayment}`}
//               </button>
//             </div>
//           </form>
          
//           <div className="mt-6 text-center">
//             <div className="flex items-center justify-center space-x-2">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
//               </svg>
//               <p className="text-sm text-gray-600">Secure Payment</p>
//             </div>
//           </div>
//         </div>
        
//         <p className="text-center text-sm text-gray-600">
//           Note: This is only an initial payment of ₹{initialPayment}. The remaining amount of ₹{remainingAmount} will be collected at the venue.
//         </p>
//       </div>
//     </div>
//   );
// };

// export default PaymentPage;