import userService from "../services/userService.js";
import { handleError } from "../utils/errorHandler.js";

async function create(req, res) {
  try {
    const user = await userService.create(req.body, req.user);
    res.status(201).json({
      message: "Utente creato correttamente",
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
      message: "Utente aggiornato correttamente",
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
      message: "Password aggiornata correttamente",
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
      message: "Password reimpostata correttamente",
      user_id: userId,
    });
  } catch (err) {
    handleError(res, err, "RESET PASSWORD ERR");
  }
}

async function remove(req, res) {
  try {
    const user = await userService.remove(req.params.user_id, req.user);
    res.status(200).json({
      message: "Utente eliminato correttamente",
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
};

export default {
  create,
  update,
  changePassword,
  resetPassword,
  remove,
};
