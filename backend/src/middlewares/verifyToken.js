import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_COOKIE = "access_token";

function verifyToken(req, res, next) {
  let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      const [scheme, headerToken] = authHeader.split(" ");
      if (scheme === "Bearer" && headerToken) {
        token = headerToken;
      }
    }
  }

  if (!token) {
    return res.status(401).json({ error: "AUTH_TOKEN_MISSING", message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({ error: "AUTH_TOKEN_INVALID", message: "Invalid token" });
    }

    req.user = decoded;
    next();

  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Token verification error:", err.message);
    }
    return res.status(401).json({ error: "AUTH_TOKEN_EXPIRED", message: "Token expired or invalid" });
  }
}

export default verifyToken;
