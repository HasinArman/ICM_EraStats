import React from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useUser } from "../GlobalContext";

const Header = () => {
  const navigate = useNavigate();
  const { state: { user }, dispatch } = useUser();

  const handleLogout = () => {
    // Remove authentication token
    Cookies.remove("auth_token");
    // Clear user state
    dispatch({ type: "SET_USER", payload: null });
    // Redirect to login page
    navigate("/login");
  };

  if (!user) return null; // Do not render the header if no user is logged in

  return (
    <header className="bg-blue-500 text-white px-4 py-2 flex justify-between items-center">
      <h1 className="text-xl font-bold">Welcome, {user.firstName}!</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
      >
        Logout
      </button>
    </header>
  );
};

export default Header;
