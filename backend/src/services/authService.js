import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authRepository from "../repositories/authRepository.js";
import { serviceError } from "../utils/errorHandler.js";
import logger from "../utils/logger.js";
import { ROLES, STATUS, AUDIT_EVENTS } from "../constants/index.js";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "7d";

function generateAccessToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id,
      role_des: user.description || user.role_des,
      company_id: user.company_id,
      type: "access",
      ...(user.must_change_password && { must_change_password: true })
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      token_version: user.token_version || 0,
      type: "refresh"
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

function formatUserResponse(user) {
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role_id: user.role_id,
    role_des: user.description || user.role_des,
    company_id: user.company_id,
    preferred_unit: user.preferred_unit || 'HOURS',
  };
}

async function login(email, password) {
  if (!email || !password) {
    throw serviceError("AUTH_EMAIL_PASSWORD_REQUIRED", "Email and password are required", 400);
  }

  const user = await authRepository.getUserByEmail(email);

  if (!user) {
    throw serviceError("AUTH_USER_NOT_FOUND", "User not found", 401);
  }

  if (user.status_id !== STATUS.ACTIVE) {
    throw serviceError("AUTH_USER_INACTIVE", "User is not active", 401);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw serviceError("AUTH_INVALID_CREDENTIALS", "Invalid credentials", 401);
  }

  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    user: formatUserResponse(user),
    must_change_password: !!user.must_change_password,
  };
}

async function impersonate(adminEmail, adminPassword, targetEmail) {
  if (!adminEmail || !adminPassword || !targetEmail) {
    throw serviceError("AUTH_IMPERSONATE_PARAMS_REQUIRED", "Missing parameters: adminEmail, adminPassword and targetEmail are required", 400);
  }

  const admin = await authRepository.getUserByEmail(adminEmail);

  if (!admin) {
    throw serviceError("AUTH_ADMIN_INVALID_CREDENTIALS", "Admin not found", 401);
  }

  if (admin.status_id !== STATUS.ACTIVE) {
    throw serviceError("AUTH_USER_INACTIVE", "User is not active", 401);
  }

  const match = await bcrypt.compare(adminPassword, admin.password_hash);
  if (!match) {
    throw serviceError("AUTH_ADMIN_INVALID_CREDENTIALS", "Invalid admin credentials", 401);
  }

  if (admin.role_id !== ROLES.ADMIN && admin.role_id !== ROLES.PM) {
    throw serviceError("AUTH_IMPERSONATE_ROLE_DENIED", "Access denied: only admins and PMs can impersonate users", 403);
  }

  const targetUser = await authRepository.getUserByEmailForImpersonate(targetEmail);

  if (!targetUser) {
    throw serviceError("AUTH_IMPERSONATE_USER_NOT_FOUND", "User to impersonate not found", 404);
  }

  if (admin.role_id === ROLES.PM && admin.company_id !== targetUser.company_id) {
    throw serviceError("AUTH_IMPERSONATE_COMPANY_MISMATCH", "Access denied: PMs can only impersonate users from their own company", 403);
  }

  logger.audit(AUDIT_EVENTS.IMPERSONATION, {
    admin_id: admin.user_id,
    admin_email: admin.email,
    admin_role: admin.role_id,
    target_user_id: targetUser.user_id,
    target_email: targetUser.email,
  });

  return {
    accessToken: generateAccessToken(targetUser),
    refreshToken: generateRefreshToken(targetUser),
    user: formatUserResponse(targetUser),
    impersonatedBy: {
      admin_id: admin.user_id,
      admin_email: admin.email,
    },
  };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw serviceError("AUTH_REFRESH_TOKEN_MISSING", "Refresh token missing", 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== "refresh") {
      throw serviceError("AUTH_TOKEN_INVALID", "Invalid token", 401);
    }

    const user = await authRepository.getUserById(decoded.user_id);

    if (!user) {
      throw serviceError("AUTH_USER_NOT_FOUND", "User not found", 401);
    }

    if (user.status_id !== STATUS.ACTIVE) {
      throw serviceError("AUTH_USER_INACTIVE", "User is not active", 401);
    }

    const currentTokenVersion = user.token_version || 0;
    const tokenVersion = decoded.token_version ?? 0;
    if (tokenVersion !== currentTokenVersion) {
      throw serviceError("AUTH_TOKEN_REVOKED", "Token has been revoked", 401);
    }

    return {
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user),
      user: formatUserResponse(user),
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw serviceError("AUTH_REFRESH_TOKEN_EXPIRED", "Refresh token expired or invalid", 401);
  }
}

async function getUserProfile(userId) {
  const user = await authRepository.getUserById(userId);
  if (!user) throw serviceError("AUTH_USER_NOT_FOUND", "User not found", 404);
  if (user.status_id !== STATUS.ACTIVE) throw serviceError("AUTH_USER_INACTIVE", "User is not active", 401);
  return formatUserResponse(user);
}

export {
  login,
  impersonate,
  refreshAccessToken,
  getUserProfile,
};

export default {
  login,
  impersonate,
  refreshAccessToken,
  getUserProfile,
};
