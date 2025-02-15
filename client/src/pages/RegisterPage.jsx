import React, { useEffect, useState } from "react";
import { MdArrowBackIos } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, signInwithGoogle } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();

  const handlesubmit = (e) => {
    e.preventDefault();
    if (!fullName) {
      toast.error("Full Name is required!");
    } else if (!email) {
      toast.error("Email is required!");
    } else if (!password) {
      toast.error("Password is required!");
    } else if (password.length < 8) {
      toast.error("Password must be at least 8 characters!");
    } else {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredentials) => {
          console.log(userCredentials);
        })
        .catch((err) => {
          if (err.code === "auth/email-already-in-use") {
            toast.error("Email already registered, login to continue.");
          } else {
            toast.error("An error occurred, please try again.");
          }
        });
    }
  };

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center text-purple-500 font-semibold">
        <Link to="/login">
          <div className="flex items-center text-sm cursor-pointer hover:text-purple-700 transition">
            <MdArrowBackIos className="mr-1" />
            Back to login
          </div>
        </Link>
        <div className="text-sm cursor-pointer hover:text-purple-700 transition">
          Need help?
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-gray-800 text-center mt-5">
        Create an Account
      </h1>
      <p className="text-gray-500 text-center mb-5">Fill in the details below</p>

      {error && <div className="text-red-500 text-center my-2">{error.message}</div>}

      <form onSubmit={handlesubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
            placeholder="Full Name"
          />
        </div>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
            placeholder="Email Address"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
            placeholder="Password"
          />
        </div>
        <div className="flex items-center">
          <input
            id="terms"
            type="checkbox"
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
            I agree to the{" "}
            <span className="text-purple-600 hover:underline cursor-pointer">terms & conditions</span> and{" "}
            <span className="text-purple-600 hover:underline cursor-pointer">privacy policy</span>.
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-purple-500 hover:bg-purple-700 text-white py-3 rounded-lg text-lg font-semibold transition"
        >
          Register
        </button>
      </form>

      <div className="flex items-center justify-center mt-6 text-gray-500">
        <div className="w-1/4 border border-gray-300"></div>
        <span className="mx-2 text-sm">OR</span>
        <div className="w-1/4 border border-gray-300"></div>
      </div>

      <button
        onClick={signInwithGoogle}
        className="w-full mt-4 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg flex justify-center items-center font-medium hover:bg-gray-100 transition"
      >
        Sign up with Google
      </button>

      <p className="text-center text-gray-600 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-purple-500 font-medium hover:underline">
          Login
        </Link>
      </p>

      <ToastContainer />
    </div>
  );
};

export default Register;
