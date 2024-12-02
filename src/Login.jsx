import React, { useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get("/data/users.json");
      const users = response.data;

      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      if (user) {
        const token = btoa(JSON.stringify({ id: user.id }));
        Cookies.set("auth_token", token, { expires: 1 });
        toast.success("Login successful!");
        setTimeout(() => {
            window.location.href = "/"; // Hard redirect to / after a short delay
          }, 1000);
      } else {
        toast.error("Invalid email or password!");
      }
    } catch (error) {
      toast.error(`An error occurred during login: ${error.message}`);
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
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default Login;
