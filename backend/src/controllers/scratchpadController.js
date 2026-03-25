import scratchpadService from "../services/scratchpadService.js";
import { handleError } from "../utils/errorHandler.js";

async function getScratchpad(req, res) {
  try {
    const content = await scratchpadService.getScratchpad(req.user);
    res.status(200).json({ content });
  } catch (err) {
    handleError(res, err, "GET SCRATCHPAD ERR");
  }
}

async function saveScratchpad(req, res) {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content : '';
    const result = await scratchpadService.saveScratchpad(content, req.user);
    res.status(200).json({ message: "Scratchpad saved", content: result.content });
  } catch (err) {
    handleError(res, err, "SAVE SCRATCHPAD ERR");
  }
}

export { getScratchpad, saveScratchpad };

export default { getScratchpad, saveScratchpad };
