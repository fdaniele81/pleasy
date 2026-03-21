import userService from "../services/userService.js";
import { handleError } from "../utils/errorHandler.js";

async function create(req, res) {
  try {
    const user = await userService.create(req.body, req.user);
    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (err) {
    handleError(res, err, "CREATE USER ERR");
  }
}

async function update(req, res) {
  try {
    const user = await userService.update(req.params.user_id, req.body, req.user);
    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    handleError(res, err, "UPDATE USER ERR");
  }
}

async function changePassword(req, res) {
  try {
    await userService.changePassword(
      req.user.user_id,
      req.body.current_password,
      req.body.new_password
    );
    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (err) {
    handleError(res, err, "CHANGE PASSWORD ERR");
  }
}

async function resetPassword(req, res) {
  try {
    const userId = await userService.resetPassword(
      req.params.user_id,
      req.body.new_password,
      req.user
    );
    res.status(200).json({
      message: "Password reset successfully",
      user_id: userId,
    });
  } catch (err) {
    handleError(res, err, "RESET PASSWORD ERR");
  }
}

async function getPreferredUnit(req, res) {
  try {
    const preferredUnit = await userService.getPreferredUnit(req.user.user_id);
    res.status(200).json({ preferred_unit: preferredUnit });
  } catch (err) {
    handleError(res, err, "GET PREFERRED UNIT ERR");
  }
}

async function updatePreferredUnit(req, res) {
  try {
    const updatedUnit = await userService.updatePreferredUnit(
      req.user.user_id,
      req.body.preferred_unit
    );
    res.status(200).json({
      message: "Preferred unit updated successfully",
      preferred_unit: updatedUnit,
    });
  } catch (err) {
    handleError(res, err, "UPDATE PREFERRED UNIT ERR");
  }
}

async function getDefaultPhasesConfig(req, res) {
  try {
    const result = await userService.getDefaultPhasesConfig(req.user.user_id);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, "GET DEFAULT PHASES CONFIG ERR");
  }
}

async function updateDefaultPhasesConfig(req, res) {
  try {
    const result = await userService.updateDefaultPhasesConfig(
      req.user.user_id,
      req.body.default_phases_config
    );
    res.status(200).json({
      message: "Default phases configuration updated successfully",
      ...result,
    });
  } catch (err) {
    handleError(res, err, "UPDATE DEFAULT PHASES CONFIG ERR");
  }
}

async function remove(req, res) {
  try {
    const user = await userService.remove(req.params.user_id, req.user);
    res.status(200).json({
      message: "User deleted successfully",
      user,
    });
  } catch (err) {
    handleError(res, err, "DELETE USER ERR");
  }
}

export {
  create,
  update,
  changePassword,
  resetPassword,
  remove,
  getPreferredUnit,
  updatePreferredUnit,
  getDefaultPhasesConfig,
  updateDefaultPhasesConfig,
};

export default {
  create,
  update,
  changePassword,
  resetPassword,
  remove,
  getPreferredUnit,
  updatePreferredUnit,
  getDefaultPhasesConfig,
  updateDefaultPhasesConfig,
};
