import { v4 as uuidv4 } from "uuid";
import holidayRepository from "../repositories/holidayRepository.js";
import { serviceError } from "../utils/errorHandler.js";

function validateDateFormat(date) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
}

async function getAll(user) {
  return await holidayRepository.getAllByCompany(user.company_id);
}

async function create(data, user) {
  const { name, date, is_recurring } = data;

  if (!name || !date) {
    throw serviceError("Nome e data sono obbligatori", 400);
  }

  if (!validateDateFormat(date)) {
    throw serviceError("Formato data non valido (usa YYYY-MM-DD)", 400);
  }

  const exists = await holidayRepository.checkExists(name, date, user.company_id);
  if (exists) {
    throw serviceError("Festività con questo nome e data già presente", 409);
  }

  const holiday_id = uuidv4();
  return await holidayRepository.create(holiday_id, name, date, is_recurring, user.company_id);
}

async function update(holidayId, data, user) {
  const { name, date, is_recurring } = data;

  const existing = await holidayRepository.getByIdAndCompany(holidayId, user.company_id);
  if (!existing) {
    throw serviceError("Festività non trovata o non appartiene alla tua azienda", 404);
  }

  if (date && !validateDateFormat(date)) {
    throw serviceError("Formato data non valido (usa YYYY-MM-DD)", 400);
  }

  return await holidayRepository.update(holidayId, name, date, is_recurring);
}

async function remove(holidayId, user) {
  const existing = await holidayRepository.getByIdAndCompany(holidayId, user.company_id);
  if (!existing) {
    throw serviceError("Festività non trovata o non appartiene alla tua azienda", 404);
  }

  await holidayRepository.remove(holidayId);
  return holidayId;
}

export {
  getAll,
  create,
  update,
  remove,
};

export default {
  getAll,
  create,
  update,
  remove,
};
