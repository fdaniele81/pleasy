import reconciliationService from "../services/reconciliationService.js";
import { handleError } from "../utils/errorHandler.js";

async function getTemplate(req, res) {
  try {
    const template = await reconciliationService.getTemplate(req.user);

    if (!template) {
      return res.status(200).json({
        message: "No template configured",
        template: null
      });
    }

    res.status(200).json({
      message: "Template retrieved",
      template
    });
  } catch (err) {
    handleError(res, err, "GET TEMPLATE ERROR");
  }
}

async function uploadFile(req, res) {
  try {
    const file = req.file;
    const { template_name } = req.body || {};

    if (!file) {
      return res.status(400).json({ error: "RECONCILIATION_FILE_REQUIRED", message: "Excel file is required" });
    }

    const result = await reconciliationService.uploadFile(file, template_name, req.user);

    if (result.isNew) {
      res.status(201).json({
        message: "Staging table created and populated. Now configure the SQL query.",
        rowsInserted: result.rowsInserted,
        stagingTableName: result.stagingTableName
      });
    } else if (result.reconciled) {
      res.status(200).json({
        message: "Upload completed and data reconciled",
        rowsProcessed: result.rowsProcessed,
        rowsInserted: result.rowsInserted
      });
    } else {
      res.status(200).json({
        message: "Staging table updated. Configure the SQL query for reconciliation.",
        rowsInserted: result.rowsInserted,
        stagingTableName: result.stagingTableName
      });
    }
  } catch (err) {
    handleError(res, err, "UPLOAD ERROR");
  }
}

async function configureTemplate(req, res) {
  try {
    const { template_name, sql_query } = req.body;
    const file = req.file;

    if (!template_name || !sql_query) {
      return res.status(400).json({
        error: "RECONCILIATION_CONFIG_REQUIRED",
        message: "template_name and sql_query are required"
      });
    }

    const template = await reconciliationService.configureTemplate(
      template_name,
      sql_query,
      file,
      req.user
    );

    const isUpdate = !!file;
    res.status(isUpdate ? 200 : 200).json({
      message: isUpdate ? "Template updated" : "SQL query updated",
      template
    });
  } catch (err) {
    handleError(res, err, "CONFIGURE TEMPLATE ERROR");
  }
}

async function deleteTemplate(req, res) {
  try {
    await reconciliationService.deleteTemplate(req.user);

    res.status(200).json({
      message: "Template deleted"
    });
  } catch (err) {
    handleError(res, err, "DELETE TEMPLATE ERROR");
  }
}

async function getSyncStatus(req, res) {
  try {
    const data = await reconciliationService.getSyncStatus(req.user);

    res.status(200).json({
      message: "Sync status retrieved",
      data
    });
  } catch (err) {
    handleError(res, err, "GET SYNC STATUS ERROR");
  }
}

async function previewQuery(req, res) {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "RECONCILIATION_QUERY_REQUIRED", message: "SQL query not provided" });
    }

    const result = await reconciliationService.previewQuery(query, req.user);

    res.status(200).json({
      message: "Query preview completed",
      ...result
    });
  } catch (err) {
    handleError(res, err, "PREVIEW QUERY ERROR");
  }
}

async function previewUsers(req, res) {
  try {
    const result = await reconciliationService.previewUsers(req.user);

    res.status(200).json({
      message: "Users view preview",
      ...result,
      info: result.viewName
    });
  } catch (err) {
    handleError(res, err, "PREVIEW USERS ERROR");
  }
}

async function previewStaging(req, res) {
  try {
    const result = await reconciliationService.previewStaging(req.user);

    res.status(200).json({
      message: "Staging table preview",
      ...result
    });
  } catch (err) {
    handleError(res, err, "PREVIEW STAGING ERROR");
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
