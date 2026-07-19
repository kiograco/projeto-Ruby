import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "../api/notifications";

function timeAgo(isoDate: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = data?.unread_count ?? 0;
  const notifications = data?.notifications ?? [];

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded p-2 text-gray-500 hover:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M12 2.25a6.75 6.75 0 0 0-6.75 6.75v3.03l-1.72 3.44a.75.75 0 0 0 .67 1.09h15.6a.75.75 0 0 0 .67-1.09l-1.72-3.44V9a6.75 6.75 0 0 0-6.75-6.75Zm0 19.5a2.25 2.25 0 0 1-2.19-1.75h4.38A2.25 2.25 0 0 1 12 21.75Z"
            clipRule="evenodd"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-sm font-medium text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-gray-500">No notifications yet.</p>
            )}
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`block w-full border-b border-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  notification.read ? "bg-white" : "bg-indigo-50/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{notification.title}</span>
                  {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                </div>
                <p className="mt-0.5 text-gray-600">{notification.body}</p>
                <p className="mt-1 text-xs text-gray-400">{timeAgo(notification.created_at)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
