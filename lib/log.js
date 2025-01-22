export default (...args) => {
  if (window.attribution && window.attribution.settings && window.attribution.settings().debug) {
    console.log.apply(console.log, [`[heimdall]`, ...args])
  }
}

export const error = (...args) => {
  console.error.apply(console.error, [`[heimdall]`, ...args])
}
