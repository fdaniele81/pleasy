import savedFiltersService from "../services/savedFiltersService.js";
import { handleError } from "../utils/errorHandler.js";

async function getFilters(req, res) {
  try {
    const filters = await savedFiltersService.getFilters(req.user.user_id);
    res.status(200).json({ saved_filters: filters });
  } catch (err) {
    handleError(res, err, "GET SAVED FILTERS ERR");
  }
}

async function saveFilter(req, res) {
  try {
    const { section, name, filters } = req.body;
    const newFilter = await savedFiltersService.saveFilter(req.user.user_id, section, name, filters);
    res.status(201).json({
      message: "Filtro salvato correttamente",
      filter: newFilter,
    });
  } catch (err) {
    handleError(res, err, "SAVE FILTER ERR");
  }
}

async function updateFilter(req, res) {
  try {
    const { section, name, filters } = req.body;
    const updated = await savedFiltersService.updateFilter(
      req.user.user_id, section, req.params.filterId, name, filters
    );
    res.status(200).json({
      message: "Filtro aggiornato correttamente",
      filter: updated,
    });
  } catch (err) {
    handleError(res, err, "UPDATE FILTER ERR");
  }
}

async function deleteFilter(req, res) {
  try {
    const { section } = req.body;
    await savedFiltersService.deleteFilter(req.user.user_id, section, req.params.filterId);
    res.status(200).json({
      message: "Filtro eliminato correttamente",
    });
  } catch (err) {
    handleError(res, err, "DELETE FILTER ERR");
  }
}

export default {
  getFilters,
  saveFilter,
  updateFilter,
  deleteFilter,
};
