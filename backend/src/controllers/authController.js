import authService from "../services/authService.js";
import { handleError } from "../utils/errorHandler.js";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
  ...(COOKIE_DOMAIN && { domain: COOKIE_DOMAIN }),
};

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, COOKIE_OPTIONS);
  res.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({ user: result.user });
  } catch (err) {
    handleError(res, err, "LOGIN ERR");
  }
}

async function impersonate(req, res) {
  try {
    const { adminEmail, adminPassword, targetEmail } = req.body;
    const result = await authService.impersonate(adminEmail, adminPassword, targetEmail);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({
      user: result.user,
      impersonatedBy: result.impersonatedBy,
    });
  } catch (err) {
    handleError(res, err, "IMPERSONATE ERR");
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const result = await authService.refreshAccessToken(refreshToken);

    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.json({ user: result.user });
  } catch (err) {
    clearAuthCookies(res);
    handleError(res, err, "REFRESH ERR");
  }
}

async function logout(req, res) {
  clearAuthCookies(res);
  res.json({ message: "Logout effettuato con successo" });
}

async function me(req, res) {
  try {
    const user = await authService.getUserProfile(req.user.user_id);
    res.json({ user });
  } catch (err) {
    handleError(res, err, "ME ERR");
  }
}

export {
  login,
  impersonate,
  refresh,
  logout,
  me,
};

export default {
  login,
  impersonate,
  refresh,
  logout,
  me,
};
