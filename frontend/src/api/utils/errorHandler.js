import { TOAST_TYPES } from "../../constants";

export const ERROR_MESSAGES = {
  LOGIN_FAILED: "Login fallito. Verifica le credenziali.",
  SESSION_EXPIRED: "Sessione scaduta. Effettua nuovamente il login.",

  COMPANY_FETCH_ERROR: "Errore nel recupero delle companies",
  COMPANY_CREATE_ERROR: "Errore nella creazione della company",
  COMPANY_UPDATE_ERROR: "Errore nell'aggiornamento della company",
  COMPANY_DELETE_ERROR: "Errore nell'eliminazione della company",

  USER_FETCH_ERROR: "Errore nel recupero degli utenti",
  USER_CREATE_ERROR: "Errore nella creazione dell'utente",
  USER_UPDATE_ERROR: "Errore nell'aggiornamento dell'utente",
  USER_DELETE_ERROR: "Errore nell'eliminazione dell'utente",
  USER_PASSWORD_RESET_ERROR: "Errore nel reset della password",
  USER_PASSWORD_CHANGE_ERROR: "Errore nel cambio password",

  CLIENT_FETCH_ERROR: "Errore nel recupero dei clienti",
  CLIENT_CREATE_ERROR: "Errore nella creazione del cliente",
  CLIENT_UPDATE_ERROR: "Errore nell'aggiornamento del cliente",
  CLIENT_DELETE_ERROR: "Errore nell'eliminazione del cliente",

  PROJECT_FETCH_ERROR: "Errore nel recupero dei progetti",
  PROJECT_CREATE_ERROR: "Errore nella creazione del progetto",
  PROJECT_UPDATE_ERROR: "Errore nell'aggiornamento del progetto",
  PROJECT_DELETE_ERROR: "Errore nell'eliminazione del progetto",

  PM_FETCH_ERROR: "Errore nel recupero dei Project Manager",
  PM_AVAILABLE_FETCH_ERROR: "Errore nel recupero dei PM disponibili",
  PM_ADD_ERROR: "Errore nell'aggiunta del PM",
  PM_REMOVE_ERROR: "Errore nella rimozione del PM",
  PM_ASSIGN_ERROR: "Errore nell'assegnazione dei PM",

  TASK_FETCH_ERROR: "Errore nel recupero dei progetti e attività",
  TASK_CREATE_ERROR: "Errore nella creazione dell'attività",
  TASK_UPDATE_ERROR: "Errore nell'aggiornamento dell'attività",
  TASK_DELETE_ERROR: "Errore nell'eliminazione dell'attività",
  TASK_INITIAL_ACTUAL_UPDATE_ERROR: "Errore nell'aggiornamento dell'initial actual",
  TASK_ETC_UPDATE_ERROR: "Errore nell'aggiornamento dell'ETC",

  PLANNING_FETCH_ERROR: "Errore nel recupero della pianificazione",
  AVAILABLE_USERS_FETCH_ERROR: "Errore nel recupero degli utenti disponibili",

  HOLIDAY_FETCH_ERROR: "Errore nel recupero delle festività",
  HOLIDAY_CREATE_ERROR: "Errore nella creazione della festività",
  HOLIDAY_UPDATE_ERROR: "Errore nell'aggiornamento della festività",
  HOLIDAY_DELETE_ERROR: "Errore nell'eliminazione della festività",

  TIMESHEET_FETCH_ERROR: "Errore nel recupero dei timesheet",
  TIMESHEET_SAVE_ERROR: "Errore nel salvataggio del timesheet",
  TIMESHEET_DELETE_ERROR: "Errore nell'eliminazione del timesheet",
  TIMESHEET_SUBMIT_ERROR: "Errore nella sottomissione dei timesheet",
  TIMESHEET_MAX_DATE_ERROR: "Errore nel recupero della data massima",
  TIMESHEET_DATES_FETCH_ERROR: "Errore nel recupero delle date con timesheet",
  TIMESHEET_PREVIEW_ERROR: "Errore nel recupero dell'anteprima",

  SNAPSHOT_FETCH_ERROR: "Errore nel recupero degli snapshot",
  SNAPSHOT_REOPEN_ERROR: "Errore nella riapertura dello snapshot",
  SNAPSHOT_DETAILS_ERROR: "Errore nel recupero dei dettagli dello snapshot",

  TIMEOFF_FETCH_ERROR: "Errore nel recupero dei time off",
  TIMEOFF_SAVE_ERROR: "Errore nel salvataggio del time off",
  TIMEOFF_TYPES_FETCH_ERROR: "Errore nel recupero dei time off types",
  TIMEOFF_PLAN_FETCH_ERROR: "Errore nel recupero del piano ferie",

  GENERIC_ERROR: "Si è verificato un errore. Riprova più tardi.",
  NETWORK_ERROR: "Errore di connessione. Verifica la tua rete.",
};

export const mapErrorToMessage = (error, operation = "GENERIC_ERROR") => {
  const errorMessage = error?.message || error || ERROR_MESSAGES[operation];

  return {
    message: errorMessage,
    type: TOAST_TYPES.ERROR,
  };
};

export const createSuccessMessage = (message) => ({
  message,
  type: TOAST_TYPES.SUCCESS,
});

export const createWarningMessage = (message) => ({
  message,
  type: TOAST_TYPES.WARNING,
});

export const createInfoMessage = (message) => ({
  message,
  type: TOAST_TYPES.INFO,
});
