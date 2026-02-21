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
      type: "access"
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
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
  };
}

async function login(email, password) {
  if (!email || !password) {
    throw serviceError("Email e password sono obbligatori", 400);
  }

  const user = await authRepository.getUserByEmail(email);

  if (!user) {
    throw serviceError("Utente non trovato", 401);
  }

  if (user.status_id !== STATUS.ACTIVE) {
    throw serviceError("Utente non attivo", 401);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw serviceError("Credenziali non valide", 401);
  }

  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    user: formatUserResponse(user),
  };
}

async function impersonate(adminEmail, adminPassword, targetEmail) {
  if (!adminEmail || !adminPassword || !targetEmail) {
    throw serviceError("Parametri mancanti: adminEmail, adminPassword e targetEmail sono richiesti", 400);
  }

  const admin = await authRepository.getUserByEmail(adminEmail);

  if (!admin) {
    throw serviceError("Credenziali admin non valide", 401);
  }

  if (admin.role_id === ROLES.USER) {
    throw serviceError("Accesso negato: solo admin e PM possono impersonare utenti", 403);
  }

  if (admin.status_id !== STATUS.ACTIVE) {
    throw serviceError("Admin non attivo", 401);
  }

  const match = await bcrypt.compare(adminPassword, admin.password_hash);
  if (!match) {
    throw serviceError("Credenziali admin non valide", 401);
  }

  const targetUser = await authRepository.getUserByEmailForImpersonate(targetEmail);

  if (!targetUser) {
    throw serviceError("Utente da impersonare non trovato", 404);
  }

  if (admin.role_id === ROLES.PM && admin.company_id !== targetUser.company_id) {
    throw serviceError("Accesso negato: i PM possono impersonare solo utenti della propria company", 403);
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
    throw serviceError("Refresh token mancante", 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== "refresh") {
      throw serviceError("Token non valido", 401);
    }

    const user = await authRepository.getUserById(decoded.user_id);

    if (!user) {
      throw serviceError("Utente non trovato", 401);
    }

    if (user.status_id !== STATUS.ACTIVE) {
      throw serviceError("Utente non attivo", 401);
    }

    return {
      accessToken: generateAccessToken(user),
      user: formatUserResponse(user),
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw serviceError("Refresh token non valido o scaduto", 401);
  }
}

async function getUserProfile(userId) {
  const user = await authRepository.getUserById(userId);
  if (!user) throw serviceError("Utente non trovato", 404);
  if (user.status_id !== STATUS.ACTIVE) throw serviceError("Utente non attivo", 401);
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
