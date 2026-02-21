import dashboardService from "../services/dashboardService.js";
import { handleError } from "../utils/errorHandler.js";

async function getProjects(req, res) {
  try {
    const { projects, owners } = await dashboardService.getProjects(req.user);
    res.status(200).json({
      message: "Progetti dashboard recuperati correttamente",
      projects: projects,
      owners: owners,
      total: projects.length,
    });
  } catch (err) {
    handleError(res, err, "GET DASHBOARD PROJECTS ERR");
  }
}

async function getEstimates(req, res) {
  try {
    const estimates = await dashboardService.getEstimates(req.user);
    res.status(200).json({
      message: "Stime dashboard recuperate correttamente",
      estimates: estimates,
      total: estimates.length,
    });
  } catch (err) {
    handleError(res, err, "GET DASHBOARD ESTIMATES ERR");
  }
}

async function getTMActivities(req, res) {
  try {
    const { tmActivities, totals } = await dashboardService.getTMActivities(req.user);
    res.status(200).json({
      message: "Attività TM recuperate correttamente",
      tmActivities: tmActivities,
      totals: totals,
      total: tmActivities.length,
    });
  } catch (err) {
    handleError(res, err, "GET DASHBOARD TM ACTIVITIES ERR");
  }
}

export {
  getProjects,
  getEstimates,
  getTMActivities,
};

export default {
  getProjects,
  getEstimates,
  getTMActivities,
};
