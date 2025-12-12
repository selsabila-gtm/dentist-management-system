// src/components/Notifications/Notifications.jsx
import React, { useEffect, useState, useCallback } from "react";
import { FiBell, FiX, FiExternalLink } from "react-icons/fi";
import "./notifications.css";

const API_BASE = "http://127.0.0.1:5000";
const EXPIRY_DAYS = 30; // consider near-expiry if within X days

function parseExpiryToDate(expiryStr) {
  if (!expiryStr) return null;
  const s = String(expiryStr).trim();
  if (s.toLowerCase() === "n/a") return null;

  // Try ISO format first: YYYY-MM-DD
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isoMatch) return new Date(s + "T00:00:00");

  // Try YYYY/MM or MM/YYYY or MM/YYYY or MM-YYYY
  // If format is MM/YYYY or MM-YYYY -> take last day of that month
  const mmYYYY = s.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (mmYYYY) {
    const mm = parseInt(mmYYYY[1], 10);
    const yyyy = parseInt(mmYYYY[2], 10);
    // last day of month
    return new Date(yyyy, mm, 0, 0, 0, 0);
  }

  // Try YYYY/MM (year first)
  const yyyyMM = s.match(/^(\d{4})[\/-](\d{1,2})$/);
  if (yyyyMM) {
    const yyyy = parseInt(yyyyMM[1], 10);
    const mm = parseInt(yyyyMM[2], 10);
    return new Date(yyyy, mm, 0, 0, 0, 0);
  }

  // fallback: try Date parse (may work for "06/2025" in some locales)
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  return null;
}

function daysBetween(from, to) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((to - from) / msPerDay);
}

export default function Notifications({ onOpenItem = (id) => {} }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const getDismissed = () => {
    try {
      return JSON.parse(localStorage.getItem("dismissed_notifications") || "[]");
    } catch {
      return [];
    }
  };

  const setDismissed = (arr) => {
    try {
      localStorage.setItem("dismissed_notifications", JSON.stringify(arr));
    } catch {}
  };

  const fetchInventoryAndBuildNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory`);
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const items = await res.json();

      const now = new Date();
      const dismissList = getDismissed();
      const notifs = [];

      for (const it of items || []) {
        // low stock check
        const qty = Number(it.quantity || 0);
        const minStock = Number(it.minimum_stock || 0);
        if (!isNaN(qty) && !isNaN(minStock) && qty <= minStock) {
          const id = `low-${it.id}`;
          if (!dismissList.includes(id)) {
            notifs.push({
              id,
              type: "Low stock",
              itemId: it.id,
              itemName: it.item_name,
              quantity: qty,
              minimum_stock: minStock,
              expiry: it.expiration_date || "N/A",
              daysLeft: null,
              created_at: now.toISOString(),
            });
          }
        }

        // expiry check
        const expDate = parseExpiryToDate(it.expiration_date);
        if (expDate) {
          const daysLeft = daysBetween(now, expDate);
          if (daysLeft <= EXPIRY_DAYS) {
            const id = `exp-${it.id}-${String(it.expiration_date)}`;
            if (!dismissList.includes(id)) {
              notifs.push({
                id,
                type: daysLeft < 0 ? "Expired" : "Expiring soon",
                itemId: it.id,
                itemName: it.item_name,
                quantity: Number(it.quantity || 0),
                minimum_stock: it.minimum_stock,
                expiry: it.expiration_date,
                daysLeft,
                created_at: now.toISOString(),
              });
            }
          }
        }
      }

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err) {
      console.error("Error building notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryAndBuildNotifications();
    // also poll every 5 minutes (optional)
    const id = setInterval(fetchInventoryAndBuildNotifications, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchInventoryAndBuildNotifications]);

  const dismiss = (notifId) => {
    const dismissed = getDismissed();
    if (!dismissed.includes(notifId)) {
      dismissed.push(notifId);
      setDismissed(dismissed);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const clearAll = () => {
    const dismissed = getDismissed();
    const ids = notifications.map((n) => n.id);
    setDismissed([...new Set([...dismissed, ...ids])]);
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="notifications-container">
      <button
        className="notif-bell"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) {
            // if opening, reset unread count to current notifications count
            setUnreadCount(notifications.length);
          }
        }}
        aria-expanded={open}
        aria-label="Notifications"
      >
        <FiBell />
        {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="region" aria-live="polite">
          <div className="notif-panel-header">
            <h3>Notifications</h3>
            <div className="notif-actions">
              <button className="link-btn" onClick={fetchInventoryAndBuildNotifications} title="Refresh">Refresh</button>
              <button className="link-btn" onClick={clearAll} title="Dismiss all">Dismiss all</button>
              <button className="close-btn" onClick={() => setOpen(false)}><FiX /></button>
            </div>
          </div>

          <div className="notif-body">
            {loading ? (
              <div className="notif-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No notifications — all clear ✅</div>
            ) : (
              <table className="notif-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Min</th>
                    <th>Expiry</th>
                    <th>Days left</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id} className={n.type === "Low stock" ? "row-low" : n.type === "Expired" ? "row-expired" : ""}>
                      <td>{n.type}</td>
                      <td>{n.itemName}</td>
                      <td>{n.quantity}</td>
                      <td>{n.minimum_stock ?? "—"}</td>
                      <td>{n.expiry ?? "N/A"}</td>
                      <td>{n.daysLeft === null ? "—" : n.daysLeft < 0 ? `${Math.abs(n.daysLeft)}d ago` : `${n.daysLeft}d`}</td>
                      <td className="notif-actions-td">
                        <button className="link-btn" onClick={() => onOpenItem(n.itemId)}>
                          <FiExternalLink /> View
                        </button>
                        <button className="link-btn" onClick={() => dismiss(n.id)}>Dismiss</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
