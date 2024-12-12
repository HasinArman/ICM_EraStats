import React, { createContext, useContext, useReducer } from "react";

// Initial state for the user context
const initialUserState = {
  user: null,
  isLogin: false, // Represents the login status
};

// Reducer function to manage user state
const userReducer = (state, action) => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, isLogin: true }; // Set user and mark as logged in
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } }; // Update user details
    case "CLEAR_USER":
      return initialUserState; // Reset state to initial values
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

// Create the context
const UserContext = createContext();

// Custom hook for accessing the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Context provider component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialUserState);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};
