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
    return res.status(401).json({ error: "Token mancante" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({ error: "Token non valido" });
    }

    req.user = decoded;
    next();

  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Errore verifica token:", err.message);
    }
    return res.status(401).json({ error: "Token non valido o scaduto" });
  }
}

export default verifyToken;
