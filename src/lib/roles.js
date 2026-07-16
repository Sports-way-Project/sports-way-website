export function isAdmin(role) {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdmin(role) {
  return role === "superadmin";
}
