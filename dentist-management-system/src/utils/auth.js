// src/utils/auth.js
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Be generous in what we accept as "admin"
export function isAdminUser(user) {
  if (!user) return false;

  if (user.is_admin) return true;
  if (user.permissions?.is_admin) return true;

  if (user.role?.name && user.role.name.toLowerCase() === "admin") return true;
  if (user.role_name && user.role_name.toLowerCase() === "admin") return true;

  return false;
}
