import timeoffService from "../services/timeoffService.js";
import { handleError } from "../utils/errorHandler.js";

async function getByDateRange(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const result = await timeoffService.getByDateRange(start_date, end_date, req.user);
    res.status(200).json({
      message: "Time off recuperati correttamente",
      timeOffs: result.timeOffs,
      historicalTotals: result.historicalTotals,
    });
  } catch (err) {
    handleError(res, err, "GET TIME OFF ERR");
  }
}

async function save(req, res) {
  try {
    const timeOff = await timeoffService.save(req.body, req.user);
    res.status(200).json({
      message: timeOff ? "Time off salvato correttamente" : "Time off eliminato correttamente",
      timeOff,
    });
  } catch (err) {
    handleError(res, err, "SAVE TIME OFF ERR");
  }
}

async function remove(req, res) {
  try {
    const timeOffId = await timeoffService.remove(req.params.time_off_id, req.user);
    res.status(200).json({
      message: "Time off eliminato correttamente",
      time_off_id: timeOffId,
    });
  } catch (err) {
    handleError(res, err, "DELETE TIME OFF ERR");
  }
}

async function getTypes(req, res) {
  try {
    const types = await timeoffService.getTypes();
    res.status(200).json({
      message: "Time off types recuperati correttamente",
      types,
    });
  } catch (err) {
    handleError(res, err, "GET TIME OFF TYPES ERR");
  }
}

async function getTotals(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const totals = await timeoffService.getTotals(start_date, end_date, req.user);
    res.status(200).json({
      message: "Totali time off recuperati correttamente",
      totals,
    });
  } catch (err) {
    handleError(res, err, "GET TIME OFF TOTALS ERR");
  }
}

async function getForCapacityPlanning(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const userTimeOffs = await timeoffService.getForCapacityPlanning(start_date, end_date, req.user);
    res.status(200).json({
      message: "Time off per capacity planning recuperati correttamente",
      userTimeOffs,
    });
  } catch (err) {
    handleError(res, err, "GET TIME OFF CAPACITY PLANNING ERR");
  }
}

async function getGanttDaily(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const timeOffs = await timeoffService.getGanttDaily(start_date, end_date, req.user);
    res.status(200).json({
      message: "Time off giornalieri per Gantt recuperati correttamente",
      timeOffs,
    });
  } catch (err) {
    handleError(res, err, "GET TIME OFF GANTT DAILY ERR");
  }
}

async function getCompanyPlan(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const users = await timeoffService.getCompanyPlan(start_date, end_date, req.user);
    res.status(200).json({
      message: "Piano ferie della company recuperato correttamente",
      users,
    });
  } catch (err) {
    handleError(res, err, "GET COMPANY TIME OFF PLAN ERR");
  }
}

export {
  getByDateRange,
  save,
  remove,
  getTypes,
  getTotals,
  getForCapacityPlanning,
  getGanttDaily,
  getCompanyPlan,
};

export default {
  getByDateRange,
  save,
  remove,
  getTypes,
  getTotals,
  getForCapacityPlanning,
  getGanttDaily,
  getCompanyPlan,
};
