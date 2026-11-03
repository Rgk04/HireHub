import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/axios";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/user/getuser");
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notification/getall", {
        params: { limit: 10 },
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const currentUser = await refreshUser();
      if (active && currentUser) {
        await refreshNotifications();
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshUser, refreshNotifications]);

  const logout = useCallback(async () => {
    try {
      await api.post("/user/logout");
    } catch {
      // Clear the client session even if the request fails.
    }
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    try {
      const { data } = await api.put(`/notification/read/${id}`);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, read: true } : item
        )
      );
      setUnreadCount(data.unread ?? 0);
    } catch {
      // Non-critical.
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await api.put("/notification/readall");
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // Non-critical.
    }
  }, []);

  const toggleSavedJob = useCallback((jobId, saved) => {
    setUser((prev) => {
      if (!prev) return prev;
      const current = (prev.savedJobs || []).map(String);
      const next = saved
        ? [...new Set([...current, String(jobId)])]
        : current.filter((id) => id !== String(jobId));
      return { ...prev, savedJobs: next };
    });
  }, []);

  const savedJobIds = useMemo(
    () => new Set((user?.savedJobs || []).map(String)),
    [user?.savedJobs]
  );

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthorized: Boolean(user),
      authLoading,
      refreshUser,
      logout,
      notifications,
      unreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      savedJobIds,
      toggleSavedJob,
    }),
    [
      user,
      authLoading,
      refreshUser,
      logout,
      notifications,
      unreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      savedJobIds,
      toggleSavedJob,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// The hook intentionally shares this module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return context;
};

export default AppContext;
