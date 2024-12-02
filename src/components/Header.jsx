import React from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove("auth_token");
    setUser(null); // Clear user state
    navigate("/login"); // Navigate to the login page
  };

  if (!user) return null;

  return (
    <header className="bg-blue-500 text-white px-4 py-2 flex justify-between items-center">
      <h1 className="text-xl font-bold">Welcome, {user.firstname}!</h1>
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
