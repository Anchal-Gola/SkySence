const API_URL = "http://localhost:5000/api/auth";

const authRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
};

export const signupUser = (userData) =>
  authRequest("/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const loginUser = (userData) =>
  authRequest("/login", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const logoutUser = () =>
  authRequest("/logout", {
    method: "POST",
  });

export const getCurrentUser = () =>
  authRequest("/me");