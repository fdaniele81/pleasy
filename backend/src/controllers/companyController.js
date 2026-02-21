import companyService from "../services/companyService.js";
import { handleError } from "../utils/errorHandler.js";

async function create(req, res) {
  try {
    const company = await companyService.create(req.body);
    res.status(201).json({
      message: "Company Creata correttamente",
      company,
    });
  } catch (err) {
    handleError(res, err, "CREATE COMPANY ERR");
  }
}

async function update(req, res) {
  try {
    const company = await companyService.update(req.params.company_id, req.body);
    res.status(200).json({
      message: "Company aggiornata correttamente",
      company,
    });
  } catch (err) {
    handleError(res, err, "UPDATE COMPANY ERR");
  }
}

async function getCompaniesWithUsers(req, res) {
  try {
    const companies = await companyService.getCompaniesWithUsers(req.user);
    res.status(200).json({
      message: "Companies recuperate correttamente",
      companies,
      total: companies.length
    });
  } catch (err) {
    handleError(res, err, "GET COMPANIES ERR");
  }
}

async function remove(req, res) {
  try {
    const company = await companyService.remove(req.params.company_id);
    res.status(200).json({
      message: "Company e utenti associati eliminati correttamente",
      company,
    });
  } catch (err) {
    handleError(res, err, "DELETE COMPANY ERR");
  }
}

export {
  create,
  update,
  getCompaniesWithUsers,
  remove,
};

export default {
  create,
  update,
  getCompaniesWithUsers,
  remove,
};
