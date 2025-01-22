export default (settings) => {
  // Extrahiert die URL-Parameter aus dem Query-String
  const parseQueryString = () => {
    return window.location.search
        .substring(1)
        .split('&')
        .reduce((queryParams, param) => {
          const [key, value] = param.split('=');
          const decodedKey = decodeURIComponent(key);
          const decodedValue = decodeURIComponent(value);
          queryParams[decodedKey] = decodedValue;
          return queryParams;
        }, {});
  };

  const allQueryParameters = parseQueryString();
  const trackedParameters = {};

  Object.entries(allQueryParameters).forEach(([key, value]) => {
    if (settings.trackQueryParameters.includes(key)) {
      trackedParameters[key] = value;
    }
  });

  return trackedParameters;
};
