import { v4 as uuidv4 } from "uuid";
import companyRepository from "../repositories/companyRepository.js";
import { companyNotExistsError } from "../utils/dbValidations.js";
import { serviceError } from "../utils/errorHandler.js";

async function create(data) {
  const { company_key, legal_name, vat_number } = data;

  if (!company_key || !legal_name) {
    throw serviceError("Il codice della company e il nome sono obbligatori", 400);
  }

  const exists = await companyRepository.checkCompanyKeyExists(company_key);
  if (exists) {
    throw serviceError("Codice Company già presente a sistema", 409);
  }

  const company_id = uuidv4();
  return await companyRepository.createCompany(company_id, company_key, legal_name, vat_number);
}

async function update(companyId, data) {
  const { legal_name, vat_number, status_id } = data;

  await companyNotExistsError(companyId);

  const existingCompany = await companyRepository.getCompanyById(companyId);
  if (!existingCompany) {
    throw serviceError("Company non trovata", 404);
  }

  const newLegalName = legal_name || existingCompany.legal_name;

  return await companyRepository.updateCompany(companyId, newLegalName, vat_number, status_id);
}

async function getCompaniesWithUsers(user) {
  const rows = await companyRepository.getCompaniesWithUsers(user.role_id, user.company_id);

  const companiesMap = new Map();

  rows.forEach(row => {
    const companyId = row.company_id;

    if (!companiesMap.has(companyId)) {
      companiesMap.set(companyId, {
        company_id: row.company_id,
        company_key: row.company_key,
        legal_name: row.legal_name,
        vat_number: row.vat_number,
        status_id: row.company_status_id,
        users: []
      });
    }

    if (row.user_id) {
      companiesMap.get(companyId).users.push({
        user_id: row.user_id,
        company_id: companyId,
        full_name: row.full_name,
        email: row.email,
        role_id: row.role_id,
        status_id: row.user_status_id
      });
    }
  });

  return Array.from(companiesMap.values());
}

async function remove(companyId) {
  await companyNotExistsError(companyId);

  await companyRepository.beginTransaction();

  try {
    await companyRepository.deleteCompanyUsers(companyId);
    const company = await companyRepository.deleteCompany(companyId);
    await companyRepository.commitTransaction();
    return company;
  } catch (err) {
    await companyRepository.rollbackTransaction();
    throw err;
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
