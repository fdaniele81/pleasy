import pool from "../db.js";
import { beginTransaction, commitTransaction, rollbackTransaction } from "../utils/dbTransactions.js";

async function checkCompanyKeyExists(companyKey) {
  const result = await pool.query(
    "SELECT company_id FROM company WHERE company_key = $1",
    [companyKey]
  );
  return result.rowCount > 0;
}

async function createCompany(companyId, companyKey, legalName, vatNumber) {
  const result = await pool.query(
    `INSERT INTO company
       (company_id, company_key, legal_name, vat_number, created_at, updated_at, status_id)
     VALUES ($1,$2,$3,$4,NOW(),NOW(),'ACTIVE')
     RETURNING company_id, company_key, legal_name, vat_number`,
    [companyId, companyKey, legalName, vatNumber]
  );
  return result.rows[0];
}

async function getCompanyById(companyId) {
  const result = await pool.query(
    "SELECT legal_name, vat_number FROM company WHERE company_id = $1",
    [companyId]
  );
  return result.rows[0];
}

async function updateCompany(companyId, legalName, vatNumber, statusId) {
  const result = await pool.query(
    `UPDATE company
        SET legal_name = $2,
            vat_number = $3,
            updated_at = NOW(),
            status_id = $4
      WHERE company_id = $1
     RETURNING company_id, legal_name, vat_number, status_id`,
    [companyId, legalName, vatNumber, statusId]
  );
  return result.rows[0];
}

async function getCompaniesWithUsers(userRole, companyId) {
  let query = `SELECT
       c.company_id,
       c.company_key,
       c.legal_name,
       c.vat_number,
       c.status_id as company_status_id,
       u.user_id,
       u.email,
       u.full_name,
       u.role_id,
       u.status_id as user_status_id
     FROM company c
     LEFT JOIN users u ON u.company_id = c.company_id AND u.status_id != 'DELETED'`;

  const queryParams = [];

  if (userRole === "PM") {
    query += ` WHERE c.company_id = $1`;
    queryParams.push(companyId);
  }

  query += ` ORDER BY c.created_at desc`;

  const result = await pool.query(query, queryParams);
  return result.rows;
}

async function deleteCompanyUsers(companyId) {
  await pool.query(
    `UPDATE users
     SET status_id = 'DELETED',
         updated_at = NOW()
     WHERE company_id = $1 AND status_id != 'DELETED'`,
    [companyId]
  );
}

async function deleteCompany(companyId) {
  const result = await pool.query(
    `UPDATE company
     SET status_id = 'DELETED',
         updated_at = NOW()
     WHERE company_id = $1
     RETURNING company_id, company_key, legal_name, status_id`,
    [companyId]
  );
  return result.rows[0];
}

export {
  checkCompanyKeyExists,
  createCompany,
  getCompanyById,
  updateCompany,
  getCompaniesWithUsers,
  deleteCompanyUsers,
  deleteCompany,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};

export default {
  checkCompanyKeyExists,
  createCompany,
  getCompanyById,
  updateCompany,
  getCompaniesWithUsers,
  deleteCompanyUsers,
  deleteCompany,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};
