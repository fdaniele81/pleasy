import reconciliationRepository from "../repositories/reconciliationRepository.js";
import { readonlyPool } from "../db.js";
import { parseExcelFile, generateCreateTableSQL, generateInsertSQL } from "../utils/excelParser.js";
import { validateReconciliationQuery } from "../utils/sqlQueryValidator.js";
import { serviceError } from "../utils/errorHandler.js";

async function getTemplate(user) {
  return reconciliationRepository.getTemplate(user.user_id, user.company_id);
}

async function uploadFile(file, templateName, user) {
  const pmId = user.user_id;
  const companyId = user.company_id;

  // Parse Excel BEFORE acquiring a DB connection/transaction
  const { columns, originalColumns, columnMapping, rows } = await parseExcelFile(file.buffer);

  const pool = reconciliationRepository.getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");

    const stagingTableName = `pm_staging_${pmId.replace(/-/g, "_")}`;

    const existingTemplate = await reconciliationRepository.getTemplateByPmId(pmId, client);

    if (!existingTemplate) {
      const finalTemplateName = templateName || "Template Riconciliazione";

      if (await reconciliationRepository.tableExists(stagingTableName, client)) {
        await reconciliationRepository.dropTable(stagingTableName, client);
      }

      const createTableSQL = generateCreateTableSQL(stagingTableName, columns, rows);
      await reconciliationRepository.createTable(createTableSQL, client);

      const usersViewName = `pm_users_view_${pmId.replace(/-/g, "_")}`;
      await reconciliationRepository.dropView(usersViewName, client);
      await reconciliationRepository.createUsersView(usersViewName, companyId, client);

      if (rows.length > 0) {
        const { sql, values } = generateInsertSQL(stagingTableName, columns, rows);
        await reconciliationRepository.insertIntoStaging(sql, values, client);
      }

      await reconciliationRepository.createTemplate({
        pmId,
        companyId,
        templateName: finalTemplateName,
        stagingTableName,
        columnNames: JSON.stringify({ columns, originalColumns, columnMapping })
      }, client);

      await client.query("COMMIT");

      return {
        isNew: true,
        rowsInserted: rows.length,
        stagingTableName
      };
    } else {
      const sqlQuery = existingTemplate.sql_query;

      await reconciliationRepository.truncateStaging(stagingTableName, client);

      if (rows.length > 0) {
        const columnNames = existingTemplate.column_names.columns;
        const { sql, values } = generateInsertSQL(stagingTableName, columnNames, rows);
        await reconciliationRepository.insertIntoStaging(sql, values, client);
      }

      if (sqlQuery && sqlQuery.trim() && !sqlQuery.startsWith("-- Scrivi qui")) {
        const validation = validateReconciliationQuery(sqlQuery, { pmId });
        if (!validation.valid) {
          await client.query("ROLLBACK");
          throw serviceError("RECONCILIATION_QUERY_INVALID", `Query salvata non valida: ${validation.error}`, 400);
        }

        const queryResult = await reconciliationRepository.executeQuery(sqlQuery, client);

        const requiredColumns = ["external_key", "total_hours", "user_id"];
        const resultColumns = queryResult.fields.map(f => f.name);
        const missingColumns = requiredColumns.filter(col => !resultColumns.includes(col));

        if (missingColumns.length > 0) {
          await client.query("ROLLBACK");
          throw serviceError(
            "RECONCILIATION_MISSING_COLUMNS",
            `Query deve restituire le colonne: ${requiredColumns.join(", ")}. Mancanti: ${missingColumns.join(", ")}`,
            400
          );
        }

        const rowsWithNullUserId = queryResult.rows.filter(row => !row.user_id);
        if (rowsWithNullUserId.length > 0) {
          await client.query("ROLLBACK");
          const problematicKeys = [...new Set(rowsWithNullUserId.map(row => row.external_key))];
          throw serviceError(
            "RECONCILIATION_NULL_USER_IDS",
            `Alcune righe non hanno trovato corrispondenza con gli utenti. Verifica la query SQL e i nomi nell'Excel. Righe con user_id NULL: ${rowsWithNullUserId.length}. Keys problematiche: ${problematicKeys.slice(0, 5).join(", ")}`,
            400
          );
        }

        await reconciliationRepository.deleteReconciliationData(pmId, client);

        let insertedCount = 0;
        if (queryResult.rows.length > 0) {
          await reconciliationRepository.bulkInsertReconciliation(
            queryResult.rows.map(row => ({
              companyId,
              externalKey: row.external_key,
              totalHours: row.total_hours,
              userId: row.user_id,
              pmId
            })),
            client
          );
          insertedCount = queryResult.rows.length;
        }

        await reconciliationRepository.updateLastUploadDate(pmId, client);
        await client.query("COMMIT");

        return {
          isNew: false,
          reconciled: true,
          rowsProcessed: queryResult.rowCount,
          rowsInserted: insertedCount
        };
      } else {
        await reconciliationRepository.updateLastUploadDate(pmId, client);
        await client.query("COMMIT");

        return {
          isNew: false,
          reconciled: false,
          rowsInserted: rows.length,
          stagingTableName
        };
      }
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function configureTemplate(templateName, sqlQuery, file, user) {
  const pmId = user.user_id;
  const companyId = user.company_id;

  const validation = validateReconciliationQuery(sqlQuery, { pmId });
  if (!validation.valid) {
    throw serviceError("RECONCILIATION_QUERY_INVALID", validation.error, 400);
  }

  // Parse Excel BEFORE acquiring a DB connection/transaction
  let parsedFile = null;
  if (file) {
    parsedFile = await parseExcelFile(file.buffer);
  }

  const pool = reconciliationRepository.getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");

    const existingTemplate = await reconciliationRepository.getTemplateByPmId(pmId, client);

    if (existingTemplate) {
      if (file) {
        const { columns, originalColumns, columnMapping, rows: parsedRows } = parsedFile;
        const stagingTableName = `pm_staging_${pmId.replace(/-/g, "_")}`;

        if (await reconciliationRepository.tableExists(stagingTableName, client)) {
          await reconciliationRepository.dropTable(stagingTableName, client);
        }

        const createTableSQL = generateCreateTableSQL(stagingTableName, columns, parsedRows);
        await reconciliationRepository.createTable(createTableSQL, client);

        const result = await reconciliationRepository.updateTemplateWithColumns({
          pmId,
          templateName,
          stagingTableName,
          columnNames: JSON.stringify({ columns, originalColumns, columnMapping }),
          sqlQuery
        }, client);

        await client.query("COMMIT");
        return result;
      } else {
        const result = await reconciliationRepository.updateTemplateWithQuery(pmId, templateName, sqlQuery, client);
        await client.query("COMMIT");
        return result;
      }
    } else {
      if (!file) {
        throw serviceError("RECONCILIATION_FILE_REQUIRED", "File Excel obbligatorio per creare un nuovo template", 400);
      }

      const { columns, originalColumns, columnMapping, rows: parsedRows } = parsedFile;
      const stagingTableName = `pm_staging_${pmId.replace(/-/g, "_")}`;

      if (await reconciliationRepository.tableExists(stagingTableName, client)) {
        await reconciliationRepository.dropTable(stagingTableName, client);
      }

      const createTableSQL = generateCreateTableSQL(stagingTableName, columns, parsedRows);
      await reconciliationRepository.createTable(createTableSQL, client);

      const result = await reconciliationRepository.createTemplateWithQuery({
        pmId,
        companyId,
        templateName,
        stagingTableName,
        columnNames: JSON.stringify({ columns, originalColumns, columnMapping }),
        sqlQuery
      }, client);

      await client.query("COMMIT");
      return result;
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteTemplate(user) {
  const pmId = user.user_id;
  const pool = reconciliationRepository.getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");

    const template = await reconciliationRepository.getTemplateByPmId(pmId, client);
    if (!template) {
      await client.query("ROLLBACK");
      throw serviceError("RECONCILIATION_TEMPLATE_NOT_FOUND", "Template not found", 404);
    }

    const stagingTableName = template.staging_table_name;

    await reconciliationRepository.dropTable(stagingTableName, client);

    const usersViewName = `pm_users_view_${pmId.replace(/-/g, "_")}`;
    await reconciliationRepository.dropView(usersViewName, client);

    await reconciliationRepository.deleteTemplate(pmId, client);
    await reconciliationRepository.deleteReconciliationData(pmId, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getSyncStatus(user) {
  return reconciliationRepository.getSyncStatus(user.company_id, user.user_id);
}

async function previewQuery(query, user) {
  const validation = validateReconciliationQuery(query, { pmId: user.user_id });
  if (!validation.valid) {
    throw serviceError("RECONCILIATION_QUERY_INVALID", validation.error, 400);
  }

  const client = await readonlyPool.connect();

  try {
    const sanitizedQuery = query.trim().replace(/;\s*$/, '');
    const previewQuery = `${sanitizedQuery} LIMIT 100`;
    const result = await client.query(previewQuery);

    if (result.rows.length > 0) {
      const resultColumns = result.fields.map(f => f.name);

      if (resultColumns.includes("user_id")) {
        const userIds = result.rows.map(row => row.user_id).filter(Boolean);
        if (userIds.length > 0) {
          // Il check cross-company usa il pool principale (il readonly potrebbe non avere accesso a `users`)
          const mainPool = reconciliationRepository.getPool();
          const mainClient = await mainPool.connect();
          let wrongCompanyCount;
          try {
            wrongCompanyCount = await reconciliationRepository.checkUsersCompany(
              userIds,
              user.company_id,
              mainClient
            );
          } finally {
            mainClient.release();
          }

          if (wrongCompanyCount > 0) {
            throw serviceError(
              "RECONCILIATION_CROSS_COMPANY",
              "ATTENZIONE: La query restituisce utenti di altre aziende! Verifica i filtri company_id nella JOIN con users.",
              403
            );
          }
        }
      }
    }

    return {
      columns: result.fields.map(f => f.name),
      rows: result.rows,
      totalRows: result.rowCount
    };
  } finally {
    client.release();
  }
}

async function previewUsers(user) {
  const usersViewName = `pm_users_view_${user.user_id.replace(/-/g, "_")}`;
  const rows = await reconciliationRepository.getUsersFromView(usersViewName);

  return {
    columns: ["user_id", "email", "full_name", "role_id", "company_id"],
    rows,
    viewName: usersViewName
  };
}

async function previewStaging(user) {
  const pool = reconciliationRepository.getPool();
  const client = await pool.connect();

  try {
    const template = await reconciliationRepository.getTemplateByPmId(user.user_id, client);
    if (!template) {
      throw serviceError("RECONCILIATION_NO_TEMPLATE", "No template configured", 404);
    }

    const { rows, fields } = await reconciliationRepository.getStagingData(
      template.staging_table_name,
      client
    );

    return {
      columns: fields.map(f => f.name),
      rows,
      totalRows: rows.length,
      tableName: template.staging_table_name
    };
  } finally {
    client.release();
  }
}

export {
  getTemplate,
  uploadFile,
  configureTemplate,
  deleteTemplate,
  getSyncStatus,
  previewQuery,
  previewUsers,
  previewStaging
};

export default {
  getTemplate,
  uploadFile,
  configureTemplate,
  deleteTemplate,
  getSyncStatus,
  previewQuery,
  previewUsers,
  previewStaging
};
