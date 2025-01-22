import queryParameters from './queryParameters'
import cookieParameters from './cookieParameters'
import * as visitParameters from './visitParameters'
import log from './log'
import * as cookieUtils from './cookieUtils'
import * as trackingUtils from './trackingUtils'
import {getCookie} from "./cookieUtils";

let trackingSettings = {
  localStorageName: '_heimdall',
  atuxCookie: '',
  fp: '',
  channel: '',
  limitVisits: 150,
  trackQueryParameters: [
    'utm_campaign',
    'utm_medium',
    'utm_source',
    'utm_content',
    'utm_term',
    'ref',
    'gclid',
    'msclkid',
    'bid',
    'awc',
    'belboon',
    'sPartner',
    'wgu',
    'fbclid'
  ],
  trackCookies: [
    /* Facebook Cookies: https://developers.facebook.com/docs/marketing-api/facebook-pixel/server-side-api/parameters#fbc */
    '_fbc',

    /* Google Analytics */
    '_gid',
    '__utma',
    '__utmb',
    '__utmc',
    '__utmz',
    '__utmv',
    '__utmx',
    '__utmxx',

    /* Google Optimize */
    '_gaexp',
    '_opt_awcid',
    '_opt_awmid',
    '_opt_awgid',
    '_opt_awkid',
    '_opt_utmc',

    /* Google Ads https://business.safety.google/adscookies/ */
    '_gcl_gb',
    '_gcl_aw',
    '_gcl_gs',
    '_gcl_ag',
    '_opt_awkid',
    '_opt_utmc',

    /* Bing Ads https://traffic3.net/wissen/datenschutz/google-cookies */
    '_uetsid',
    '_uetvid',
    '_uetmsclkid',

    /* ADCELL  */
    'adcell',

    /* Webgains  */
    'partner',
    '__CK__WG__',

    /* AWIN - View  */
    'AWSESS',

    /* AWIN - Click https://success.awin.com/s/article/What-kind-of-cookies-does-Awin-use?language=de */
    '_aw_sn_*',
    '_aw_j_*',

    /* IDEALO https://cg1.link/OOCw */
    '__utma',

  ],
  trackReferrer: true,
  ignoreVisitsWithoutUTMParameters: false,
  visitFilterFunction: null, // Only accept visits if this function returns true
  debug: true,
}

let thisVisit = null

export const save = () => {
  // Set cookie data
  const previousVisits = visitParameters.get(trackingSettings)
  thisVisit = {
    time: (new Date()).toUTCString(),
    query: queryParameters(trackingSettings),
    cookies: cookieParameters(trackingSettings),
    page: window.location.href,
    atuxCookie: trackingSettings.atuxCookie,
    channel: trackingSettings.channel
  }

  if (trackingSettings.trackReferrer) {
    thisVisit.referrer = document.referrer
  }

  if (trackingSettings.ignoreVisitsWithoutUTMParameters) {
    let shouldIgnore = true
    const queryParamKeys = Object.keys(thisVisit.query || {});
    const trackQueryParamLen = trackingSettings.trackQueryParameters.length;
    for(let i = 0; i < trackQueryParamLen; i++) {
      if(queryParamKeys.includes(trackingSettings.trackQueryParameters[i])) {
        shouldIgnore = false;
        break;
      }
    }

    if (shouldIgnore) {
      log('Ignoring visit, no UTM parameters found.');
      return
    }
  }

  if (trackingSettings.visitFilterFunction) {
    if (!trackingSettings.visitFilterFunction(thisVisit)) {
      log('Ignoring visit, visitFilterFunction returned falsey.');
      return
    }
  }

  let visits = [
    ...previousVisits,
    thisVisit
  ].filter(t => !!t)

  if (visits.length > trackingSettings.limitVisits) {
    visits = [ visits[0], ...visits.splice(2, visits.length)]
  }

  visitParameters.set(trackingSettings, visits)

  return thisVisit
}

export const settings = (options) => {
  if (options) {
    trackingSettings = {
      ...trackingSettings,
      ...options
    }
  }

  return trackingSettings
}

export const params = () => {
  if (!thisVisit) {
    save()
  }

  return thisVisit
}

export const firstClickParams = () => {
  const visits = visitParameters.get(trackingSettings)

    return visits[0]
}

export const historicalParams = () => {
  return visitParameters.get(trackingSettings)
}

export const sendToServer = async (endpoint) => {
  const visitParametersData = visitParameters.get(trackingSettings);

  try {
    const myHeaders = new Headers();
    const formdata = new FormData();
    formdata.append('visitParametersData', JSON.stringify(visitParametersData));
    formdata.append('fp', trackingSettings.fp);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow"
    };

    fetch(endpoint + "/api/customer-journey/updateorcreate", requestOptions)
        .then((response) => response.text())
        .catch((error) => console.error(error));

    // Remove Customer Journey
    visitParameters.del(trackingSettings);
  } catch (error) {
    log('There was a problem sending the data:');
    log(error);
  }
}

const networkMapping = [
  { param: 'bid', name: 'ADCELL', expiry: 30 },
  { param: 'adcell_id', name: 'ADCELL', expiry: 30 },
  { param: 'belboon', name: 'Belboon', expiry: 30 },
  { param: 'awc', name: 'AWIN', expiry: 30 },
  { param: 'wgu', name: 'Webgains', expiry: 30 },
  { param: 'gclid', name: 'Google', expiry: 1 },
  { param: 'msclkid', name: 'Bing', expiry: 1 },
  { param: 'li_fat_id', name: 'LinkedIn', expiry: 30 },
  { param: 'fbclid', name: 'META', expiry: 30 },
  { param: 'twclid', name: 'Twitter', expiry: 30 },
  { param: 'billiger', name: 'Billiger', expiry: 30 },
  { param: 'ref', name: 'GoAffPro', expiry: 30 }
];

const allowedUTMSource = [
  { param: 'billiger.de', name: 'Billiger', expiry: 1 },
  { param: 'biliger.de', name: 'Billiger.de', expiry: 1 },
  { param: 'email', name: 'E-Mail', expiry: 1 },
  { param: 'klaviyo', name: 'Klaviyo', expiry: 1 },
  { param: 'brevo', name: 'Brevo', expiry: 1 }
];

const trackingMethods = {
  DIRECT: 1,
  SUB_SHOP: 2,
  PARAMETER: 3,
  COOKIE: 4,
  UTM: 5,
  PV: 6,
  REFERRER: 7,
  DISCOUNT_CODE: 8
};

function magaDebugLog(message) {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('magaDebug')) {
    console.log(message);
  }
}

async function getDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  let glInfo = '';

  if (gl) {
    const glParams = [
      'ALIASED_LINE_WIDTH_RANGE', 'ALIASED_POINT_SIZE_RANGE', 'ALPHA_BITS',
      'BLUE_BITS', 'DEPTH_BITS', 'GREEN_BITS', 'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
      'MAX_CUBE_MAP_TEXTURE_SIZE', 'MAX_FRAGMENT_UNIFORM_VECTORS', 'MAX_RENDERBUFFER_SIZE',
      'MAX_TEXTURE_IMAGE_UNITS', 'MAX_TEXTURE_SIZE', 'MAX_VARYING_VECTORS',
      'MAX_VERTEX_ATTRIBS', 'MAX_VERTEX_TEXTURE_IMAGE_UNITS', 'MAX_VERTEX_UNIFORM_VECTORS',
      'MAX_VIEWPORT_DIMS', 'RED_BITS', 'RENDERER', 'SHADING_LANGUAGE_VERSION',
      'VENDOR', 'VERSION'
    ];

    glInfo = glParams.map(param => gl.getParameter(gl[param])).join(',');
  }

  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;
  const clientInfo = window.clientInformation || navigator;

  const networkInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};

  const fonts = await detectFonts();

  const fingerprintData = {
    userAgent: clientInfo.userAgent,
    languages: navigatorInfo.languages ? navigatorInfo.languages.join(',') : navigatorInfo.language,
    platform: clientInfo.platform,
    cookieEnabled: navigatorInfo.cookieEnabled,
    cpuClass: clientInfo.cpuClass || '',
    hardwareConcurrency: clientInfo.hardwareConcurrency || '',
    deviceMemory: clientInfo.deviceMemory || '',
    colorDepth: screenInfo.colorDepth,
    pixelDepth: screenInfo.pixelDepth,
    timezoneOffset: new Date().getTimezoneOffset(),
    pluginsLength: navigatorInfo.plugins.length,
    mimeTypesLength: navigatorInfo.mimeTypes.length,
    glInfo: glInfo,
    canvasFingerprint: getCanvasFingerprint(),
    downlink: networkInfo.downlink,
    rtt: networkInfo.rtt,
    touchSupport: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints,
    fonts: fonts,
    indexedDBAvailable: 'indexedDB' in window,
    doNotTrack: navigator.doNotTrack
  };

  const fingerprintJson = JSON.stringify(fingerprintData);
  return fingerprintJson;
}

function getCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("Browserle!", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("Browserle!", 4, 17);
  const dataUrl = canvas.toDataURL();
  return dataUrl;
}

async function detectFonts() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testString = 'mmmmmmmmmwwwwwwwww';

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = "72px monospace";

  const baseWidth = {};
  const baseHeight = {};

  for (let baseFont of baseFonts) {
    context.font = `72px ${baseFont}`;
    baseWidth[baseFont] = context.measureText(testString).width;
    baseHeight[baseFont] = parseInt(context.measureText(testString).actualBoundingBoxAscent + context.measureText(testString).actualBoundingBoxDescent);
  }

  const detectedFonts = [];
  for (let font of getFontList()) {
    let matches = 0;
    for (let baseFont of baseFonts) {
      context.font = `72px ${font}, ${baseFont}`;
      const width = context.measureText(testString).width;
      const height = parseInt(context.measureText(testString).actualBoundingBoxAscent + context.measureText(testString).actualBoundingBoxDescent);
      if (width !== baseWidth[baseFont] || height !== baseHeight[baseFont]) {
        matches++;
      }
    }
    if (matches >= 2) { // At least two match to be sure it's not just because of fallback
      detectedFonts.push(font);
    }
  }
  return detectedFonts.join(",");
}

function getFontList() {
  return [
    'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Times New Roman',
    'Georgia', 'Garamond', 'Courier New', 'Brush Script MT', 'Comic Sans MS', 'Impact',
    'Lucida Sans Unicode', 'Palatino Linotype', 'Windows Webdings', 'MS Sans Serif',
    'MS Serif', 'Symbol'
  ];
}

function getAllUrlParams(url) {
  const queryString = url ? url.split('?')[1] : window.location.search.slice(1);
  const paramsObj = {};

  if (!queryString) return paramsObj;

  const cleanQueryString = queryString.split('#')[0];
  const queryParamsArray = cleanQueryString.split('&');

  queryParamsArray.forEach((param) => {
    const [key, value] = param.split('=');
    const paramName = normalizeKey(key);
    const paramValue = normalizeValue(value);

    if (isArrayParam(paramName)) {
      handleArrayParam(paramsObj, paramName, paramValue);
    } else {
      handleScalarParam(paramsObj, paramName, paramValue);
    }
  });

  return paramsObj;
}

function normalizeKey(key) {
  return key.toLowerCase();
}

function normalizeValue(value) {
  return typeof value === 'undefined' ? true : value.toLowerCase();
}

function isArrayParam(paramName) {
  return paramName.match(/\[(\d+)?\]$/);
}

function handleArrayParam(obj, paramName, paramValue) {
  const key = paramName.replace(/\[(\d+)?\]/, '');
  if (!obj[key]) obj[key] = [];

  if (paramName.match(/\[\d+\]$/)) {
    const index = /\[(\d+)\]/.exec(paramName)[1];
    obj[key][index] = paramValue;
  } else {
    obj[key].push(paramValue);
  }
}

function handleScalarParam(obj, paramName, paramValue) {
  if (!obj[paramName]) {
    obj[paramName] = paramValue;
  } else if (typeof obj[paramName] === 'string') {
    obj[paramName] = [obj[paramName], paramValue];
  } else {
    obj[paramName].push(paramValue);
  }
}

function generateRandomString(length = 32) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function getSubShopPath() {
  var pathArray = window.location.pathname.split('/');

  return pathArray[1];
}

function getVisit() {
  const urlParams = getAllUrlParams();

  for (let network of networkMapping) {
    if (urlParams[network.param]) {
      return network.name;
    }
  }
  return false;
}

function getLocalStorageWithExpiry(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return null;
  }

  try {
    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (e) {
    console.error('Fehler beim Parsen des localStorage-Eintrags:', e);
    return null;
  }
}

function setNetwork() {
  var subShopPath = getSubShopPath();
  var urlParams = getAllUrlParams();
  var atux = cookieUtils.getCookie('atux');
  const cookieMapping = [
    { cookie: ['AWSESS', 'aw', 'awpv', 'aw3', 'awc'], name: 'AWIN', prio: 1, expiry: 30 },
    { cookie: ['adcell', 'adcell_id', 'adcell_token', 'adcell_merchant'], name: 'ADCELL', prio: 1, expiry: 30 },
    { cookie: ['__CK__WG__', 'wgcampaignid', 'wguserid'], name: 'Webgains', prio: 1, expiry: 30 },
    { cookie: ['_gcl_gb', '_gcl_aw', '_gcl_gs', '_gcl_ag', '_opt_awkid', '__gads', '__gpi'], name: 'Google', prio: 3, expiry: 1 },
    { cookie: ['_uetsid', '_uetvid', '_uetmsclkid'], name: 'Bing', prio: 3, expiry: 1 },
    { cookie: ['_fbc'], name: 'META', prio: 3, expiry: 1 }
  ];

  // Überprüfen von direkten Parametern
  for (let network of networkMapping) {
    if (urlParams[network.param]) {
      if (network.param === 'awc') {
        cookieUtils.setCookie('atux_awc', urlParams[network.param], network.expiry);
      }
      if (network.param === 'bid') {
        cookieUtils.setCookie('atux_bid', urlParams[network.param], network.expiry);
      }
      trackingUtils.saveNetworkWithTracking(network.name, trackingMethods.PARAMETER, network.expiry);
      magaDebugLog(`User came from ${network.name}`);
      return;
    }
  }

  // Überprüfen von utm-Parametern
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign'];
  for (let param of utmParams) {
    if (urlParams[param]) {
      for (let network of networkMapping) {
        if (urlParams[param].toLowerCase().includes(network.name.toLowerCase())) {
          trackingUtils.saveNetworkWithTracking(network.name, trackingMethods.UTM, network.expiry);
          magaDebugLog(`User came from ${network.name} via ${param}`);
          return;
        }
      }
    }
  }

  const subShopMapping = {
    'deu': 'IDEALO',
    'de_': 'Bestcheck',
    'de': 'Billiger.de',
    'at': 'Billiger.at'
  };

  if (subShopMapping[subShopPath]) {
    trackingUtils.saveNetworkWithTracking(subShopMapping[subShopPath], trackingMethods.SUB_SHOP, 30);
    magaDebugLog(`User came from ${subShopMapping[subShopPath]}`);
    return;
  }

  // Überprüfen der Cookies, wenn kein `atux` vorhanden ist
  if (!atux) {
    let directEntryNetworks = [];
    let highestPriorityNetwork = null;
    let selectedCookie = null;

    // Prüfen der Cookies und Auswahl abhängig von Priorität
    for (let cookieCheck of cookieMapping) {
      for (let cookie of cookieCheck.cookie) {
        const cookieValue = cookieUtils.getCookie(cookie);
        if (cookieValue) {
          if (!highestPriorityNetwork || cookieCheck.prio < highestPriorityNetwork.prio) {
            highestPriorityNetwork = {
              name: cookieCheck.name,
              prio: cookieCheck.prio,
              expiry: cookieCheck.expiry
            };
            selectedCookie = cookie;
          }
          if (cookieCheck.prio <= 2) {
            directEntryNetworks.push(cookieCheck.name);
          }
        }
      }
    }

    // Hier wird berücksichtigt, ob es mehrere Cookies gibt und ob Google/Bing nur ausgewählt werden, wenn es einen direkten Eintrag gibt
    if (directEntryNetworks.length > 0 && (highestPriorityNetwork.name === 'Google' || highestPriorityNetwork.name === 'Bing')) {
      trackingUtils.saveNetworkWithTracking(directEntryNetworks[0], trackingMethods.COOKIE, directEntryNetworks[0].expiry, selectedCookie);
    } else if (highestPriorityNetwork) {
      trackingUtils.saveNetworkWithTracking(highestPriorityNetwork.name, trackingMethods.COOKIE, highestPriorityNetwork.expiry, selectedCookie);
    } else {
      magaDebugLog('No network identified.');

      // Überprüfen des Referrer-Headers für Suchmaschinen
      const referrer = document.referrer;
      if (referrer.includes('google.')) {
        trackingUtils.saveNetworkWithTracking('Google Search', trackingMethods.REFERRER, 1);
        magaDebugLog('User came from Google Search');
      } else if (referrer.includes('bing.')) {
        trackingUtils.saveNetworkWithTracking('Bing Search', trackingMethods.REFERRER, 1);
        magaDebugLog('User came from Bing Search');
      } else if (referrer.includes('search.yahoo.')) {
        trackingUtils.saveNetworkWithTracking('Yahoo Search', trackingMethods.REFERRER, 1);
        magaDebugLog('User came from Yahoo Search');
      } else if (referrer.includes('duckduckgo.com')) {
        trackingUtils.saveNetworkWithTracking('duckduckgo', trackingMethods.REFERRER, 1);
        magaDebugLog('User came from duckduckgo');
      } else if (referrer.includes('idealo.de')) {
        trackingUtils.saveNetworkWithTracking('IDEALO', trackingMethods.REFERRER, 1);
        magaDebugLog('User came from IDEALO');
      } else if (referrer.includes('facebook')) {
        trackingUtils.saveNetworkWithTracking('META', trackingMethods.REFERRER, 1);
        magaDebugLog('User came from META');
      } else if (referrer.includes('guenstiger.de')) {
        trackingUtils.saveNetworkWithTracking('Guenstiger_de', trackingMethods.REFERRER, 1);
        magaDebugLog('User came from Guenstiger_de');
      } else {
        if (urlParams['utm_source']) {
          for (let UTMSource of allowedUTMSource) {
            if (urlParams['utm_source'].toLowerCase().includes(UTMSource.param.toLowerCase())) {
              trackingUtils.saveNetworkWithTracking(UTMSource.name, trackingMethods.UTM, UTMSource.expiry);
              return;
            }
          }
        }
      }
    }
  } else {
    magaDebugLog('already stored, skipping cookie check.');
  }
}

function postView() {
  const urlParams = getAllUrlParams();
  const network = getVisit();
  console.log(network);
  if (false !== network) {
    setLocalStorageWithExpiry(`atux_pv_${network}`, JSON.stringify(urlParams), 3);
    cookieUtils.setCookie(`atux_pv_${network}`, JSON.stringify(urlParams), 3);
    console.log(`PostView entry stored for ${network}`);
  }

}

function analyseTraffic() {
  const path = window.location.pathname;
  if (path === '/htlp' || path === '/htlp/' || path === '/a/htlp' || path === '/ngc/htlp') {
    postView();
  } else {
    setNetwork();
  }

    trackingSettings.atuxCookie = localStorage.getItem("atux");
    trackingSettings.channel = getVisit();

    // Ihre restliche Logik
    settings(trackingSettings);
    save();

  const paramObject = params();
  paramObject.time = new Date().toUTCString();  // Füge den aktuellen Zeitpunkt hinzu

    //vCk
    var vCk = cookieUtils.getCookie('adcell_vc');
    if (vCk) {
      cookieUtils.setCookie('atux_vck', vCk, 3);
    }

    // Hole bestehende Cookie-Daten
    let existingCookie = getCookie('_heimdall');
    try {
      if (existingCookie) {
        existingCookie = JSON.parse(existingCookie);
      } else {
        existingCookie = [];
      }
    } catch (e) {
      console.error('JSON.parse-Fehler:', e);
      // Standardwert setzen, falls JSON ungültig ist
      existingCookie = [];
    }

    // Neue Parameter hinzufügen
    existingCookie.push(paramObject);

    // Setze das Cookie mit den erweiterten Daten
    cookieUtils.setCookie('_heimdall', JSON.stringify(existingCookie), 30);

}

// Beispielaufruf (async Kontext bei Verwendung)
(async () => {
  analyseTraffic();
})();


(async () => {
  try {
    if (typeof window.magaDomain === "undefined") {
      window.magaDomain = "m-a-g-a.de";
    }
    let hitsCookie = cookieUtils.getCookie('atux_hits');
    let hits = hitsCookie ?? generateRandomString(64);
    cookieUtils.setCookie('atux_hits', hits, 364);

    let bodyData = {
      params: params(),
      fp: hits
    };

    const formBody = btoa(JSON.stringify(bodyData));

    const cjResponse = await fetch(
        "https://" + magaDomain + "/api/hits/s",
        {
          method: "POST",
          body: formBody,
        }
    );
    if (cjResponse.ok) {
      // localStorage.removeItem('_heimdall');
    }
  } catch (err) {
    console.error(err);
  }
})();

export {
  setNetwork
};
