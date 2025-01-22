const COOKIE_PATH = ";path=/;SameSite=None;Secure";

/**
 * Helper function to clear a cookie by setting an expired date.
 */
function clearCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

export function setCookie(name, value, expiryInDays) {
    clearCookie(name);

    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + expiryInDays * 24 * 60 * 60 * 1000);
    const expires = `expires=${expiryDate.toUTCString()}`;

    document.cookie = `${name}=${value};${expires}${COOKIE_PATH}`;
}

export function getCookie(name) {
    const cookieName = `${name}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookiesArray = decodedCookie.split(';');

    for (let cookie of cookiesArray) {
        cookie = cookie.trim();
        if (cookie.startsWith(cookieName)) {
            return cookie.substring(cookieName.length);
        }
    }
    return undefined;
}
