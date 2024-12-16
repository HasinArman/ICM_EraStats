import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Dashboard from "./Dashboard";
import Header from "./components/Header";
import RegisterPage from "./RegisterPage";

import { useUser } from "./GlobalContext";

const App = () => {
  const [loading, setLoading] = useState(true); // Loading state for user authentication
  const { state: { user }, dispatch } = useUser(); // Access user and dispatch from context

  // useEffect(() => {
  //   const fetchUserDetails = async () => {
  //     const token = Cookies.get("auth_token");
  //     if (!token) {
  //       setLoading(false);
  //       return;
  //     }

  //     try {
  //       const response = await axios.get(
  //         "http://localhost:5000/api/auth/userinfo",
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );

  //       if (response.data.status) {
  //         dispatch({ type: "SET_USER", payload: response.data.user });
  //       } else {
  //         toast.error(response.data.error);
  //         Cookies.remove("auth_token");
  //       }
  //     } catch (error) {
  //       toast.error("An error occurred while fetching user details.");
  //       Cookies.remove("auth_token");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUserDetails();
  // }, [dispatch]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      {/* {user && <Header />} */}
      <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" />} />


        {/* {user ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )} */}
      </Routes>
      <ToastContainer />
    </>
  );
};

export default App;
