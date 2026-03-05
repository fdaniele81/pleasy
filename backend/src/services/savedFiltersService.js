import { v4 as uuidv4 } from "uuid";
import userRepository from "../repositories/userRepository.js";
import { serviceError } from "../utils/errorHandler.js";

const VALID_SECTIONS = ["timesheet", "planning"];
const MAX_FILTERS_PER_SECTION = 20;

async function getFilters(userId) {
  return await userRepository.getSavedFilters(userId);
}

async function saveFilter(userId, section, name, filters) {
  if (!VALID_SECTIONS.includes(section)) {
    throw serviceError("Sezione non valida", 400);
  }
  if (!name || !name.trim()) {
    throw serviceError("Il nome del filtro è obbligatorio", 400);
  }
  if (!filters || typeof filters !== "object") {
    throw serviceError("I filtri sono obbligatori", 400);
  }

  const savedFilters = await userRepository.getSavedFilters(userId);
  const sectionFilters = savedFilters[section] || [];

  if (sectionFilters.length >= MAX_FILTERS_PER_SECTION) {
    throw serviceError(`Massimo ${MAX_FILTERS_PER_SECTION} filtri per sezione`, 400);
  }

  const newFilter = {
    id: uuidv4(),
    name: name.trim(),
    filters,
    created_at: new Date().toISOString(),
  };

  sectionFilters.push(newFilter);
  savedFilters[section] = sectionFilters;

  await userRepository.updateSavedFilters(userId, savedFilters);
  return newFilter;
}

async function updateFilter(userId, section, filterId, name, filters) {
  if (!VALID_SECTIONS.includes(section)) {
    throw serviceError("Sezione non valida", 400);
  }

  const savedFilters = await userRepository.getSavedFilters(userId);
  const sectionFilters = savedFilters[section] || [];

  const filterIndex = sectionFilters.findIndex((f) => f.id === filterId);
  if (filterIndex === -1) {
    throw serviceError("Filtro non trovato", 404);
  }

  if (name) sectionFilters[filterIndex].name = name.trim();
  if (filters) sectionFilters[filterIndex].filters = filters;

  savedFilters[section] = sectionFilters;
  await userRepository.updateSavedFilters(userId, savedFilters);
  return sectionFilters[filterIndex];
}

async function deleteFilter(userId, section, filterId) {
  if (!VALID_SECTIONS.includes(section)) {
    throw serviceError("Sezione non valida", 400);
  }

  const savedFilters = await userRepository.getSavedFilters(userId);
  const sectionFilters = savedFilters[section] || [];

  const filterIndex = sectionFilters.findIndex((f) => f.id === filterId);
  if (filterIndex === -1) {
    throw serviceError("Filtro non trovato", 404);
  }

  sectionFilters.splice(filterIndex, 1);
  savedFilters[section] = sectionFilters;

  await userRepository.updateSavedFilters(userId, savedFilters);
}

export default {
  getFilters,
  saveFilter,
  updateFilter,
  deleteFilter,
};
