import reconciliationService from "../services/reconciliationService.js";
import { handleError } from "../utils/errorHandler.js";

async function getTemplate(req, res) {
  try {
    const template = await reconciliationService.getTemplate(req.user);

    if (!template) {
      return res.status(200).json({
        message: "Nessun template configurato",
        template: null
      });
    }

    res.status(200).json({
      message: "Template recuperato",
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
      return res.status(400).json({ error: "File Excel non fornito" });
    }

    const result = await reconciliationService.uploadFile(file, template_name, req.user);

    if (result.isNew) {
      res.status(201).json({
        message: "Staging table creata e popolata. Ora configura la query SQL.",
        rowsInserted: result.rowsInserted,
        stagingTableName: result.stagingTableName
      });
    } else if (result.reconciled) {
      res.status(200).json({
        message: "Upload completato e dati riconciliati",
        rowsProcessed: result.rowsProcessed,
        rowsInserted: result.rowsInserted
      });
    } else {
      res.status(200).json({
        message: "Staging table aggiornata. Configura la query SQL per la riconciliazione.",
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
        error: "template_name e sql_query sono obbligatori"
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
      message: isUpdate ? "Template aggiornato" : "Query SQL aggiornata",
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
      message: "Template eliminato"
    });
  } catch (err) {
    handleError(res, err, "DELETE TEMPLATE ERROR");
  }
}

async function getSyncStatus(req, res) {
  try {
    const data = await reconciliationService.getSyncStatus(req.user);

    res.status(200).json({
      message: "Sync status recuperato",
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
      return res.status(400).json({ error: "Query SQL non fornita" });
    }

    const result = await reconciliationService.previewQuery(query, req.user);

    res.status(200).json({
      message: "Anteprima query completata",
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
      message: "Anteprima vista utenti",
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
      message: "Anteprima tabella staging",
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
