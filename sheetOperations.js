module.exports = function() {
  const operations = {};

  let sheets;
  let auth;
  require('./googleAuth.js')().then((googleAuth) => {
    sheets = googleAuth.google.sheets('v4');
    auth = googleAuth.auth;
  });
  const utils = require('./utils.js')();

  /**
  * Returns a promise that resolves with sheet data of sheet
  * @param {number|string} sheet - A sheet ID or sheet name
  */
  operations.getSheet = function(sheet) {
    return new Promise(async function(resolve, reject) {
      const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: sheet,
        auth: auth
      }
      let response = await sheets.spreadsheets.values.get(request);
      resolve(response.data.values);
    });
  };

  operations.sendRequests = function(requests) {
    return new Promise(async function(resolve, reject) {
      sheets.spreadsheets.batchUpdate(utils.genBatchUpdateBody(auth, requests), (err, res) => {
        if (err) {
          console.error(err);
          reject();
        }
        else resolve();
      });
    });
  };

  /**
  * Gets a value for a character.
  * @param {Array} table - The table to operate on
  * @param {string} charName - A character's nameChange
  * @param {string} valueName - The name of the value to query
  * @param {boolean} [prefix] - A flag to designate checking for prefix instead of matching
  */
  operations.getCharacterValue = function(table, charName, valueName, prefix) {
    const valueColIndex = table[HEADER_ROW].indexOf(valueName);
    const charRowIndex = operations.getRowWithValue(table, CHAR_COLUMN, charName, prefix)
    if (charRowIndex === -1) return null;
    return table[charRowIndex][valueColIndex];
  };

  operations.getPlayerValue = function(table, playerId, valueName) {

  };

  /**
  * Gets the row index of the first row with value in the valueName column.
  * @param {Array} table - The table to operate on
  * @param {string} valueName - The column header
  * @param {string} value - The value
  * @param {boolean} [prefix] - A flag to designate checking for prefix instead of matching
  */
  operations.getRowWithValue = function(table, valueName, value, prefix) {
    const valueColIndex = table[HEADER_ROW].indexOf(valueName);
    const colArray = table.map(row => row[valueColIndex]);
    if (!prefix) return colArray.indexOf(value);
    return colArray.reduce((ret, val, index) => {
      if (ret !== -1) return ret;
      if (val.toUpperCase().startsWith(value.toUpperCase())) return index;
      return -1;
    }, -1);
  };

  return operations;
};
