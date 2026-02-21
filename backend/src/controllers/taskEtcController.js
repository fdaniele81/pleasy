import taskEtcService from "../services/taskEtcService.js";
import { handleError } from "../utils/errorHandler.js";

async function getByTaskId(req, res) {
  try {
    const etcList = await taskEtcService.getByTaskId(req.params.task_id, req.user);
    res.status(200).json({
      message: "ETC recuperati correttamente",
      etc_list: etcList,
    });
  } catch (err) {
    handleError(res, err, "GET TASK ETC ERR");
  }
}

async function upsert(req, res) {
  try {
    const etc = await taskEtcService.upsert(req.body, req.user);
    res.status(201).json({
      message: "ETC creato/aggiornato correttamente",
      etc,
    });
  } catch (err) {
    handleError(res, err, "CREATE/UPDATE ETC ERR");
  }
}

async function remove(req, res) {
  try {
    const result = await taskEtcService.remove(req.params.etc_id, req.user);
    res.status(200).json({
      message: "ETC eliminato correttamente",
      etc_id: result.etc_id,
    });
  } catch (err) {
    handleError(res, err, "DELETE ETC ERR");
  }
}

export {
  getByTaskId,
  upsert,
  remove,
};

export default {
  getByTaskId,
  upsert,
  remove,
};
