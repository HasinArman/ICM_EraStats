import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./Login";
import Dashboard from "./Dashboard";
import Header from "./components/Header";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = Cookies.get("auth_token");
        if (token) {
          const decoded = JSON.parse(atob(token));
          const userId = decoded.id;

          const response = await axios.get("/data/users.json");
          const users = response.data;

          const loggedInUser = users.find((u) => u.id === userId);
          if (loggedInUser) {
            setUser(loggedInUser);
            toast.success(`Welcome back, ${loggedInUser.firstname}!`);
          } else {
            toast.error("Invalid token. Please log in again.");
            Cookies.remove("auth_token");
          }
        }
      } catch (error) {
        toast.error("An error occurred while fetching user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <ToastContainer />
      {user &&  <Header user={user} setUser={setUser} />}
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;
