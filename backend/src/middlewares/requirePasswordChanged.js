/**
 * Middleware che blocca l'accesso alle API se l'utente deve cambiare password.
 * Le route esenti (cambio password, logout, me) vanno montate PRIMA di questo middleware
 * oppure escluse tramite il check sul path.
 */
function requirePasswordChanged(req, res, next) {
  if (req.user?.must_change_password) {
    return res.status(403).json({
      error: "AUTH_MUST_CHANGE_PASSWORD",
      message: "Password change required before accessing the application"
    });
  }
  next();
}

export default requirePasswordChanged;
