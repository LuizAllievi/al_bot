const debugEnabled = true;

function log(id, ...args) {
  if (debugEnabled) {
    console.log(`[${id}]`, ...args);
  }
}

function error(id, ...args) {
  console.error(`[${id}]`, ...args);
}

module.exports = { log, error };
