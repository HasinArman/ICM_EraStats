import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useUser } from "./GlobalContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { state: { user }, dispatch } = useUser();

  const token = Cookies.get("auth_token");

  useEffect(() => {
    if (user && token) {
      navigate("/"); // Redirect to dashboard if user is already logged in
    }
  }, [token, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (response.data.status) {
        const token = response.data.token;
        dispatch({ type: "SET_USER", payload: response.data.user });
        Cookies.set("auth_token", token, { expires: 1 });
        toast.success("Login successful!");
        navigate("/"); // Redirect immediately after successful login
      } else {
        toast.error(response.data.error || "Invalid credentials.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        className="bg-white p-8 rounded shadow-md w-96"
        onSubmit={handleLogin}
      >
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>

        <div className="text-center mt-4">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-500 underline">
              Register here
            </Link>
          </p>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default Login;
