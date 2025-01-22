import * as log from './log';

// Fehlernachrichten als Konstanten
const ERROR_GET_ITEM = '[localStorage.getItem + parse failed]';
const ERROR_SET_ITEM = '[localStorage.setItem + stringification failed]';
const ERROR_REMOVE_ITEM = '[localStorage.removeItem failed]';

// Hilfsfunktion zur einheitlichen Fehlerbehandlung
const handleError = (message, error) => {
  log.error(message, error);
};

// Standard-Konstanten für localStorage-Namen (falls nicht angegeben)
const DEFAULT_LOCAL_STORAGE_NAME = 'defaultStorageName';

// Funktion zum Abrufen von Daten aus dem localStorage
export const get = (settings) => {
  const storageKey = settings.localStorageName || DEFAULT_LOCAL_STORAGE_NAME;
  try {
    const storedData = localStorage.getItem(storageKey);
    return JSON.parse(storedData) || [];
  } catch (error) {
    handleError(ERROR_GET_ITEM, error);
    return [];
  }
};

// Funktion zum Speichern von Daten im localStorage
export const set = (settings, newParameters) => {
  const storageKey = settings.localStorageName || DEFAULT_LOCAL_STORAGE_NAME;
  try {
    const jsonData = JSON.stringify(newParameters);
    localStorage.setItem(storageKey, jsonData);
  } catch (error) {
    handleError(ERROR_SET_ITEM, error);
  }
};

// Funktion zum Löschen von Daten aus dem localStorage
export const del = (settings) => {
  const storageKey = settings.localStorageName || DEFAULT_LOCAL_STORAGE_NAME;
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    handleError(ERROR_REMOVE_ITEM, error);
  }
};
