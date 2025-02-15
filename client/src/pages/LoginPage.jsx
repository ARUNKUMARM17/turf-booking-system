import { useState, useEffect } from "react";
import { auth, signInwithGoogle } from "../firebase";
import { MdArrowBackIos } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { signInWithEmailAndPassword } from "firebase/auth";

const initialState = {
  email: "",
  password: ""
};

const LoginPage = () => {
  const [Data, setData] = useState(initialState);
  const { email, password } = Data;
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required!");
    } else if (!password) {
      toast.error("Password is required!");
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          toast.success("Logged in successfully");
          navigate("/");
        })
        .catch((err) => {
          if (err.code === "auth/invalid-email") {
            toast.error("Invalid email!");
          } else if (err.code === "auth/user-not-found") {
            toast.error("User not registered!");
          } else if (err.code === "auth/wrong-password") {
            toast.error("Incorrect password!");
          } else {
            toast.error("Login failed. Try again!");
          }
        });
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setData({ ...Data, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-300 to-purple-500 items-center justify-center p-4">
      <div className="bg-white shadow-2xl rounded-lg p-10 w-full max-w-md border-4 border-purple-500">
        <h1 className="text-4xl font-extrabold text-center text-purple-600 mb-6">🏏 Turf Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center">
          <label className="relative w-full">
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-full outline-none focus:border-purple-500 transition duration-200 shadow-md"
            />
          </label>
          <label className="relative w-full mt-4">
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-full outline-none focus:border-purple-500 transition duration-200 shadow-md"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-purple-700 hover:bg-purple-800 text-white p-3 rounded-full transition duration-300 shadow-lg font-semibold mt-5"
          >
            Login
          </button>
          <div className="flex items-center justify-center mt-5 text-gray-500 w-full">
            <div className="border border-gray-300 w-1/3 mr-2" />
            OR
            <div className="border border-gray-300 w-1/3 ml-2" />
          </div>
          <button
            onClick={signInwithGoogle}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-full transition duration-300 shadow-lg flex items-center justify-center gap-3 border border-gray-300 mt-4"
          >
            <FcGoogle className="text-2xl" />
            Login with Google
          </button>
        </form>
        <p className="text-center text-gray-700 mt-6">
          Don't have an account? <Link to="/register" className="text-purple-600 hover:underline">Register here</Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;
