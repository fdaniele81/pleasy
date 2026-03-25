import scratchpadRepository from "../repositories/scratchpadRepository.js";

async function getScratchpad(user) {
  const row = await scratchpadRepository.getScratchpad(user.user_id);
  return row ? row.content : '';
}

async function saveScratchpad(content, user) {
  const result = await scratchpadRepository.saveScratchpad(user.user_id, content);
  return result;
}

export { getScratchpad, saveScratchpad };

export default { getScratchpad, saveScratchpad };
