const { parse } = require("csv-parse/sync");

function parseCSV(buffer) {
  return parse(buffer, {
    skip_empty_lines: true,
    delimiter: ";",
  });
}

module.exports = { parseCSV };
