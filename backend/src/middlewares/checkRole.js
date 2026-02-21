
function checkRole(allowedRoles) {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        error: "Utente non autenticato"
      });
    }

    if (!allowedRoles.includes(req.user.role_id)) {
      return res.status(403).json({
        error: "Accesso negato: ruolo non autorizzato",
        required_roles: allowedRoles,
        your_role: req.user.role_id
      });
    }

    next();
  };
}

export default checkRole;
