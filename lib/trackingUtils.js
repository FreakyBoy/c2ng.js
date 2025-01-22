import * as cookieUtils from './cookieUtils';

// Wiederverwendbare Konstanten
const NETWORK_COOKIE_NAME = 'atux';
const TRACKING_COOKIE_NAME = 'atux_trk';

// Hilfsfunktion zum Speichern in Cookies und LocalStorage
function saveToStorageAndCookie(cookieName, key, value, expiryInDays) {
    const jsonData = JSON.stringify(value);
    cookieUtils.setCookie(cookieName, jsonData, expiryInDays);
    localStorage.setItem(key, jsonData);
}

// Hauptfunktion refaktoriert
export function saveNetworkWithTracking(network, method, expiryInDays, networkCookie = null) {
    const trackingData = { network, method, cookie: networkCookie };

    // Speichern der Netzwerkdaten in Cookies und LocalStorage
    saveToStorageAndCookie(NETWORK_COOKIE_NAME, NETWORK_COOKIE_NAME, network, expiryInDays);
    sessionStorage.setItem(NETWORK_COOKIE_NAME, network);

    // Speichern der Tracking-Daten
    saveToStorageAndCookie(TRACKING_COOKIE_NAME, TRACKING_COOKIE_NAME, trackingData, expiryInDays);
}

// Funktionalität zum Speichern in LocalStorage mit Ablaufdatum
export function setLocalStorageWithExpiry(key, value, expiryInDays) {
    const now = new Date();
    const item = {
        value,
        expiry: now.getTime() + expiryInDays * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(key, JSON.stringify(item));
}
