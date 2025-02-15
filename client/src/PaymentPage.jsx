// import React, { useEffect, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
 
// import emailjs from 'emailjs-com';

// function PaymentPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { date, slot, time, userEmail } = location.state;
//   const [qrCode, setQrCode] = useState('');

//   useEffect(() => {
//     if (date && slot && time && userEmail) {
//       const qrData = `Date: ${date.toDateString()}, Slot: ${slot}, Time: ${time}, User: ${userEmail}`;
//       setQrCode(qrData);
//     }
//   }, [date, slot, time, userEmail]);

//   const sendEmail = () => {
//     emailjs.send(
//       'service_yga78v3', // Replace with your EmailJS service ID
//       'template_hnxkcgk', // Replace with your EmailJS template ID
//       {
//         user_name: userEmail.split('@')[0], // Extracting username from email
//         to_email: userEmail,
//         date: date.toDateString(),
//         slot: slot,
//         time: time,
//         qr_code: qrCode // QR Code will be sent as a string
  
//       },
//       'gDVLs7qlKCH4h3vJN' // Replace with your EmailJS user ID
//     ).then(
//       (response) => console.log('Email sent successfully', response),
//       (error) => console.log('Email send failed', error)
//     );
//   };

//   const handlePayment = () => {
//     alert('Payment Successful! QR Code Sent to Email.');
//     sendEmail();
//     navigate('/booking', { state: { date, slot, time, confirmed: true } });
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
//       <h1 className="text-3xl font-bold mb-4">Confirm Payment</h1>
//       <p className="text-lg mb-4">Date: {date.toDateString()}</p>
//       <p className="text-lg mb-4">Slot: {slot}</p>
//       <p className="text-lg mb-4">Time: {time}</p>
//       {qrCode && <QRCode value={qrCode} className="mb-4" />}
//       <button
//         className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition"
//         onClick={handlePayment}
//       >
//         Pay Now
//       </button>
//     </div>
//   );
// };

// export default PaymentPage;
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from 'react-qr-code';
import emailjs from "emailjs-com";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { date, slot, time, userEmail } = location.state || {};
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    if (date && slot && time && userEmail) {
      const qrData = `Date: ${date}, Slot: ${slot}, Time: ${time}, User: ${userEmail}`;
      setQrCode(qrData);
    }
  }, [date, slot, time, userEmail]);

  const sendEmail = async (qrUrl) => {
    try {
      await emailjs.send(
        'service_yga78v3', 
        'template_hnxkcgk',
 // Replace with Template ID
        {
          user_name: userEmail.split('@')[0],
          to_email: userEmail,
          date,
          slot,
          time,
          qr_code: qrUrl // Send QR code URL in email
        },
        "public_key" // Replace with your EmailJS public key
      );
    } catch (error) {
      console.error("Email send failed", error);
    }
  };

  const handlePayment = async () => {
    if (!date || !slot || !time || !userEmail) {
      alert("Missing required data. Please try again.");
      return;
    }

    alert("Payment Successful! Booking confirmed.");

    try {
      // Store booking + QR Code in Firebase
      const bookingRef = await addDoc(collection(db, "bookings"), {
        date,
        slot,
        time,
        userEmail,
        status: "booked",
        qrCode, // Store QR Code text in DB
      });

      console.log("Booking saved with ID:", bookingRef.id);
      sendEmail(qrCode); // Send QR via email
      navigate("/booking"); // Redirect to bookings page
    } catch (error) {
      console.error("Error saving booking:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold mb-4">Confirm Payment</h1>
      <p className="text-lg mb-4">Date: {date}</p>
      <p className="text-lg mb-4">Slot: {slot}</p>
      <p className="text-lg mb-4">Time: {time}</p>

      {qrCode && (
        <div className="mb-4">
          <QRCode value={qrCode} />
        </div>
      )}

      <button
        className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition"
        onClick={handlePayment}
      >
        Pay Now
      </button>
    </div>
  );
};

export default PaymentPage;
