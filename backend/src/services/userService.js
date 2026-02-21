import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import userRepository from "../repositories/userRepository.js";
import checkCompanyAccess from "../utils/checkCompanyAccess.js";
import {
  emailExistsError,
  companyNotExistsError,
  roleNotExistsError,
  statusNotExistsError,
  userNotExistsError,
} from "../utils/dbValidations.js";
import { serviceError } from "../utils/errorHandler.js";

async function create(data, requestingUser) {
  const { company_id, email, password, role_id, full_name } = data;

  if (!company_id || !email || !role_id || !password || !full_name) {
    throw serviceError("Company, email, ruolo, nome e password sono obbligatori", 400);
  }

  if (requestingUser.role_id === "PM" && role_id === "ADMIN") {
    throw serviceError("Non hai i permessi per assegnare il ruolo ADMIN", 403);
  }

  checkCompanyAccess(requestingUser, company_id);

  await emailExistsError(email);
  await companyNotExistsError(company_id);
  await roleNotExistsError(role_id);

  const user_id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);

  return await userRepository.createUser(user_id, company_id, email, password_hash, role_id, full_name);
}

async function update(userId, data, requestingUser) {
  const { email, role_id, status_id, full_name } = data;

  await userNotExistsError(userId);

  if (!email || !role_id || !status_id || !full_name) {
    throw serviceError("Email, ruolo, stato e nome sono obbligatori", 400);
  }

  if (requestingUser.role_id === "PM" && role_id === "ADMIN") {
    throw serviceError("Non hai i permessi per assegnare il ruolo ADMIN", 403);
  }

  const user = await userRepository.getUserById(userId);
  checkCompanyAccess(requestingUser, user.company_id);

  await roleNotExistsError(role_id);
  await statusNotExistsError(status_id);
  if (email !== user.email) await emailExistsError(email);

  return await userRepository.updateUser(userId, email, role_id, status_id, full_name);
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw serviceError("Password attuale e nuova password sono obbligatorie", 400);
  }

  await userNotExistsError(userId);

  const user = await userRepository.getUserById(userId);

  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw serviceError("Password attuale non corretta", 401);
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await userRepository.updatePassword(userId, newPasswordHash);
}

async function resetPassword(targetUserId, newPassword, requestingUser) {
  if (!newPassword) {
    throw serviceError("Nuova password obbligatoria", 400);
  }

  const user = await userRepository.getUserById(targetUserId);
  checkCompanyAccess(requestingUser, user.company_id);

  await userNotExistsError(targetUserId);

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await userRepository.updatePassword(targetUserId, newPasswordHash);
  return targetUserId;
}

async function remove(userId, requestingUser) {
  await userNotExistsError(userId);

  const user = await userRepository.getUserById(userId);
  checkCompanyAccess(requestingUser, user.company_id);

  return await userRepository.deleteUser(userId);
}

export {
  create,
  update,
  changePassword,
  resetPassword,
  remove,
};

export default {
  create,
  update,
  changePassword,
  resetPassword,
  remove,
};
