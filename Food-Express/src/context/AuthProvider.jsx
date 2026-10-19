import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { apiRequest, getAccessToken, setAccessToken } from "../utils/api";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [availableRestaurants, setAvailableRestaurants] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const refreshRestaurants = useCallback(async () => {
    try {
      const result = await apiRequest("/restaurants");
      setAvailableRestaurants(result.restaurants);
      setApiError("");
    } catch (error) {
      setApiError(error.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        if (getAccessToken()) {
          const result = await apiRequest("/auth/me");
          if (active) setUser(result.user);
        }
      } catch (error) {
        setAccessToken(null);
        if (error.status !== 401 && active) setApiError(error.message);
      } finally {
        if (active) setAuthLoading(false);
      }
      if (active) await refreshRestaurants();
    };
    void restoreSession();
    return () => {
      active = false;
    };
  }, [refreshRestaurants]);

  useEffect(() => {
    const updateRestaurants = () => {
      void refreshRestaurants();
    };
    window.addEventListener("focus", updateRestaurants);
    const refreshInterval = window.setInterval(updateRestaurants, 30000);
    return () => {
      window.removeEventListener("focus", updateRestaurants);
      window.clearInterval(refreshInterval);
    };
  }, [refreshRestaurants]);

  const register = useCallback(async (details) => {
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: details,
    });
    return result.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setAccessToken(result.token);
    setUser(result.user);
    setApiError("");
    return result.user;
  }, []);

  const updateRestaurant = useCallback(async (restaurantId, updates) => {
    try {
      const result = await apiRequest(
        `/restaurants/${encodeURIComponent(restaurantId)}`,
        { method: "PATCH", body: updates },
      );
      setUser(result.user);
      await refreshRestaurants();
      return true;
    } catch (error) {
      setApiError(error.message);
      throw error;
    }
  }, [refreshRestaurants]);

  const updateCustomerProfile = useCallback(async (profile) => {
    const result = await apiRequest("/customer/profile", {
      method: "PATCH",
      body: profile,
    });
    setUser(result.user);
    setApiError("");
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      authLoading,
      apiError,
      clearApiError: () => setApiError(""),
      register,
      login,
      logout,
      updateRestaurant,
      updateCustomerProfile,
      availableRestaurants,
      refreshRestaurants,
    }),
    [
      user,
      authLoading,
      apiError,
      register,
      login,
      logout,
      updateRestaurant,
      updateCustomerProfile,
      availableRestaurants,
      refreshRestaurants,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
