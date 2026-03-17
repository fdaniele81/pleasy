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
import { validatePassword } from "../validators/passwordValidator.js";

async function create(data, requestingUser) {
  const { company_id, email, password, role_id, full_name, must_change_password, symbol_letter, symbol_bg_color, symbol_letter_color } = data;

  if (!company_id || !email || !role_id || !password || !full_name) {
    throw serviceError("USER_REQUIRED_FIELDS", "Company, email, role, name and password are required", 400);
  }

  if (requestingUser.role_id === "PM" && role_id === "ADMIN") {
    throw serviceError("USER_ADMIN_ROLE_DENIED", "You don't have permission to assign the ADMIN role", 403);
  }

  checkCompanyAccess(requestingUser, company_id);

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw serviceError("USER_PASSWORD_WEAK", passwordValidation.error, 400);
  }

  await emailExistsError(email);
  await companyNotExistsError(company_id);
  await roleNotExistsError(role_id);

  const user_id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);

  return await userRepository.createUser(user_id, company_id, email, password_hash, role_id, full_name, !!must_change_password, symbol_letter || null, symbol_bg_color || null, symbol_letter_color || null);
}

async function update(userId, data, requestingUser) {
  const { email, role_id, status_id, full_name, must_change_password, symbol_letter, symbol_bg_color, symbol_letter_color } = data;

  await userNotExistsError(userId);

  if (!email || !role_id || !status_id || !full_name) {
    throw serviceError("USER_UPDATE_REQUIRED_FIELDS", "Email, role, status and name are required", 400);
  }

  if (requestingUser.role_id === "PM" && role_id === "ADMIN") {
    throw serviceError("USER_ADMIN_ROLE_DENIED", "You don't have permission to assign the ADMIN role", 403);
  }

  const user = await userRepository.getUserById(userId);
  checkCompanyAccess(requestingUser, user.company_id);

  await roleNotExistsError(role_id);
  await statusNotExistsError(status_id);
  if (email !== user.email) await emailExistsError(email);

  // Solo Admin può settare must_change_password
  const mustChangePwd = requestingUser.role_id === "ADMIN" && must_change_password !== undefined
    ? !!must_change_password
    : undefined;

  return await userRepository.updateUser(userId, email, role_id, status_id, full_name, mustChangePwd, symbol_letter !== undefined ? symbol_letter : undefined, symbol_bg_color, symbol_letter_color);
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw serviceError("USER_PASSWORDS_REQUIRED", "Current password and new password are required", 400);
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw serviceError("USER_PASSWORD_WEAK", passwordValidation.error, 400);
  }

  await userNotExistsError(userId);

  const user = await userRepository.getUserById(userId);

  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw serviceError("USER_CURRENT_PASSWORD_WRONG", "Current password is incorrect", 400);
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await userRepository.updatePassword(userId, newPasswordHash);
}

async function resetPassword(targetUserId, newPassword, requestingUser) {
  if (!newPassword) {
    throw serviceError("USER_NEW_PASSWORD_REQUIRED", "New password is required", 400);
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw serviceError("USER_PASSWORD_WEAK", passwordValidation.error, 400);
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
