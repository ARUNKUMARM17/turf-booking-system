import { useState, useEffect } from "react";
import { auth, signInwithGoogle } from "../firebase";
import { MdArrowBackIos } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

const initialState = {
  email: "",
  password: "",
};

const LoginPage = () => {
  const [Data, setData] = useState(initialState);
  const { email, password } = Data;
  const [user, loading] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required!");
      return;
    }
    if (!password) {
      toast.error("Password is required!");
      return;
    }

    setIsSubmitting(true);

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.includes("google.com")) {
        toast.info("This email is linked to Google Sign-In. Please use 'Login with Google'.");
        setIsSubmitting(false);
        return;
      }

      if (signInMethods.length === 0) {
        toast.error("No account found. Please register first.");
        setIsSubmitting(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
      setData(initialState); // Clear input fields
      navigate("/");
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        toast.error("Invalid email format!");
      } else if (err.code === "auth/user-not-found") {
        toast.error("User not found. Please register!");
      } else if (err.code === "auth/wrong-password") {
        toast.error("Incorrect password! Click 'Forgot Password' to reset.");
      } else {
        toast.error("Login failed. Try again!");
      }
    }

    setIsSubmitting(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first!");
      return;
    }

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.includes("google.com")) {
        toast.error("This email is linked to Google Sign-In. Cannot reset password.");
        return;
      }

      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      toast.error("Failed to send password reset email. Try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const googleUser = await signInwithGoogle();
      if (!googleUser) return;

      const signInMethods = await fetchSignInMethodsForEmail(auth, googleUser.user.email);
      if (!signInMethods.includes("password")) {
        setShowPasswordModal(true); // Show password setup modal
      } else {
        toast.success("Logged in successfully with Google!");
        navigate("/");
      }
    } catch (error) {
      toast.error("Google Sign-In failed. Try again.");
    }
    setIsGoogleLoading(false);
  };

  const handleSetPassword = async () => {
    if (!newPassword) {
      toast.error("Password cannot be empty!");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, newPassword);
      await linkWithCredential(auth.currentUser, credential);
      toast.success("Password set successfully! You can now log in with Email/Password.");
      setShowPasswordModal(false);
      setNewPassword(""); // Clear password field
    } catch (error) {
      if (error.code === "auth/credential-already-in-use") {
        toast.error("This email is already linked to another account.");
      } else {
        toast.error("Failed to set password. Try again.");
      }
    }
  };

  useEffect(() => {
    if (loading) return;
    if (user) navigate("/");
  }, [user, loading, navigate]);

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
            disabled={isSubmitting}
            className={`w-full ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-purple-700 hover:bg-purple-800"
            } text-white p-3 rounded-full transition duration-300 shadow-lg font-semibold mt-5`}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-purple-600 hover:underline text-center mt-3"
          >
            Forgot Password?
          </button>
          <div className="flex items-center justify-center mt-5 text-gray-500 w-full">
            <div className="border border-gray-300 w-1/3 mr-2" />
            OR
            <div className="border border-gray-300 w-1/3 ml-2" />
          </div>
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className={`w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-full transition duration-300 shadow-lg flex items-center justify-center gap-3 border border-gray-300 mt-4 ${
              isGoogleLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <FcGoogle className="text-2xl" />
            {isGoogleLoading ? "Signing in..." : "Login with Google"}
          </button>
        </form>
        <p className="text-center text-gray-700 mt-6">
          Don't have an account? <Link to="/register" className="text-purple-600 hover:underline">Register here</Link>
        </p>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Set a Password</h2>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter a new password"
              className="w-full p-3 border border-gray-300 rounded-full outline-none focus:border-purple-500 transition duration-200 shadow-md"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSetPassword}
                className="w-full bg-blue-500 text-white p-3 rounded-full transition duration-300 shadow-lg font-semibold"
              >
                Save Password
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full bg-gray-500 text-white p-3 rounded-full transition duration-300 shadow-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default LoginPage;