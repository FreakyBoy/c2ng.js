import queryParameters from './queryParameters'
import cookieParameters from './cookieParameters'
import * as visitParameters from './visitParameters'
import log from './log'

let trackingSettings = {
  localStorageName: '_c2ngjs',
  networkGeniusCookie: '',
  fp: '',
  channel: '',
  limitVisits: 15,
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
  ],
  trackCookies: [
    /* Facebook Cookies: https://developers.facebook.com/docs/marketing-api/facebook-pixel/server-side-api/parameters#fbc */
    '_fbc',
    '_fbp',

    /* Google Analytics */
    '_ga',
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

    /* AWIN - View  */
    'AWSESS',

    /* AWIN - Click https://success.awin.com/s/article/What-kind-of-cookies-does-Awin-use?language=de */
    '_aw_sn_*',
    '_aw_j_*',

    /* IDEALO https://cg1.link/OOCw */
    '__utma',

  ],
  trackReferrer: true,
  ignoreVisitsWithoutUTMParameters: true,
  visitFilterFunction: null, // Only accept visits if this function returns true
  debug: false
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
    networkGeniusCookie: trackingSettings.networkGeniusCookie,
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
