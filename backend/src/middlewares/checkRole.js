
function checkRole(allowedRoles) {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        error: "AUTH_NOT_AUTHENTICATED",
        message: "User not authenticated"
      });
    }

    if (!allowedRoles.includes(req.user.role_id)) {
      return res.status(403).json({
        error: "AUTH_ROLE_DENIED",
        message: "Access denied: unauthorized role",
        required_roles: allowedRoles,
        your_role: req.user.role_id
      });
    }

    next();
  };
}

export default checkRole;
