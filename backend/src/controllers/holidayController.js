import holidayService from "../services/holidayService.js";
import { handleError } from "../utils/errorHandler.js";

async function getAll(req, res) {
  try {
    const holidays = await holidayService.getAll(req.user);
    res.status(200).json({
      message: "Holidays retrieved successfully",
      holidays: holidays,
      total: holidays.length,
    });
  } catch (err) {
    handleError(res, err, "GET HOLIDAYS ERR");
  }
}

async function create(req, res) {
  try {
    const holiday = await holidayService.create(req.body, req.user);
    res.status(201).json({
      message: "Holiday created successfully",
      holiday,
    });
  } catch (err) {
    handleError(res, err, "CREATE HOLIDAY ERR");
  }
}

async function update(req, res) {
  try {
    const holiday = await holidayService.update(req.params.holiday_id, req.body, req.user);
    res.status(200).json({
      message: "Holiday updated successfully",
      holiday,
    });
  } catch (err) {
    handleError(res, err, "UPDATE HOLIDAY ERR");
  }
}

async function remove(req, res) {
  try {
    const holidayId = await holidayService.remove(req.params.holiday_id, req.user);
    res.status(200).json({
      message: "Holiday deleted successfully",
      holiday_id: holidayId,
    });
  } catch (err) {
    handleError(res, err, "DELETE HOLIDAY ERR");
  }
}

export {
  getAll,
  create,
  update,
  remove,
};

export default {
  getAll,
  create,
  update,
  remove,
};
