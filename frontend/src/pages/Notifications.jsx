import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBell,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiTrash2,
} from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import { ROLE } from "../utils/constants";
import { timeAgo } from "../utils/format";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";
import { TableSkeleton } from "../components/UI/Loader";

const TYPE_ICONS = {
  application: <FiFileText />,
  status: <FiCheckCircle />,
  job: <FiBriefcase />,
  system: <FiBell />,
};

const Notifications = () => {
  const { user, refreshNotifications } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/notification/getall", {
        params: { page, limit: 10 },
      });
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
      setPagination({
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      });
      await refreshNotifications();
    } catch (err) {
      setError(getErrorMessage(err, "Could not load notifications."));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, refreshNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const setPage = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value <= 1) params.delete("page");
    else params.set("page", value);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markRead = async (notification) => {
    if (notification.read) return;
    try {
      await api.put(`/notification/read/${notification._id}`);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id ? { ...item, read: true } : item
        )
      );
      setUnread((value) => Math.max(0, value - 1));
      await refreshNotifications();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put("/notification/readall");
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnread(0);
      await refreshNotifications();
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const remove = async (notification) => {
    try {
      await api.delete(`/notification/${notification._id}`);
      setNotifications((prev) =>
        prev.filter((item) => item._id !== notification._id)
      );
      setUnread((value) =>
        notification.read ? value : Math.max(0, value - 1)
      );
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      await refreshNotifications();
      toast.success("Notification removed.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const linkFor = (notification) => {
    if (notification.application) {
      return user?.role === ROLE.EMPLOYER
        ? "/employer/applicants"
        : "/applications";
    }
    if (notification.job) return `/jobs/${notification.job}`;
    return null;
  };

  return (
    <div className="notifications-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiBell /> Updates
          </span>
          <h1>Notifications</h1>
          <p>
            {unread > 0
              ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}.`
              : "You are all caught up."}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={markAllRead}
            disabled={markingAll}
          >
            <FiCheck /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <EmptyState
          icon={<FiBell />}
          title="Could not load notifications"
          message={error}
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={fetchNotifications}
            >
              Try again
            </button>
          }
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<FiBell />}
          title="No notifications yet"
          message="Application updates, status changes and announcements will appear here."
        />
      ) : (
        <>
          <div className="notification-list">
            {notifications.map((notification) => {
              const link = linkFor(notification);
              const content = (
                <>
                  <span
                    className={`notification-icon notification-icon-${
                      notification.type || "system"
                    }`}
                  >
                    {TYPE_ICONS[notification.type] || <FiBell />}
                  </span>
                  <div className="notification-main">
                    <div className="notification-title">
                      <strong>{notification.title}</strong>
                      {!notification.read && (
                        <span className="unread-dot" aria-label="Unread" />
                      )}
                    </div>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                </>
              );

              return (
                <article
                  key={notification._id}
                  className={`notification-row ${
                    notification.read ? "" : "is-unread"
                  }`}
                >
                  {link ? (
                    <Link
                      to={link}
                      className="notification-link"
                      onClick={() => markRead(notification)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="notification-link"
                      onClick={() => markRead(notification)}
                    >
                      {content}
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn notification-delete"
                    onClick={() => remove(notification)}
                    aria-label="Delete notification"
                    title="Delete notification"
                  >
                    <FiTrash2 />
                  </button>
                </article>
              );
            })}
          </div>
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default Notifications;
