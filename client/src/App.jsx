import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import SlotsPage from './pages/SlotsPage';
import BookingPage from './pages/BookingPage';
import TimingsPage from './pages/TimingsPage';
import PaymentPage from './PaymentPage';
import './App.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/slots" element={<SlotsPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/timings" element={<TimingsPage />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
    </Router>
  );
}
