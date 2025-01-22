import Cookies from 'js-cookie';

/**
 * Extrahiert und liefert die gültigen Cookie-Daten basierend auf den angegebenen Cookie-Schlüsseln.
 * @param {Object} settings - Die Einstellungen mit dem Schlüssel `trackCookies`.
 * @returns {Object} Eine Sammlung von gültigen Cookies.
 */
export default function getTrackedCookies(settings) {
  return extractCookies(settings.trackCookies);
}

/**
 * Prüft und sammelt die Cookie-Werte für die gegebenen Schlüssel.
 * @param {string[]} cookieKeys - Die Liste der Cookie-Schlüssel.
 * @returns {Object} Ein Objekt mit den Cookie-Schlüsseln und -Werten.
 */
function extractCookies(cookieKeys) {
  return cookieKeys.reduce((collectedCookies, key) => {
    const value = Cookies.get(key);
    if (value) {
      collectedCookies[key] = value;
    }
    return collectedCookies;
  }, {});
}
