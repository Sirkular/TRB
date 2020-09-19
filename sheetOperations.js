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

  operations.sendRequests = function(requests, message, log=false) {
    return new Promise(async function(resolve, reject) {
      sheets.spreadsheets.batchUpdate(utils.genBatchUpdateBody(auth, requests), (err, res) => {
        if (err) {
          console.error(err);
          reject();
        }
        else {
          if (log) {
            resolve();
          } else {
            operations.addLogs(message);
            resolve();
          }
        }
      });
    });
  };

  /**
  * Gets a value for a character.
  * @param {Array} table - The table to operate on
  * @param {string} charName - A character's name
  * @param {string} valueName - The name of the value to query
  * @param {boolean} [prefix] - A flag to designate checking for prefix instead of matching
  */
  operations.getValue = function(table, columnName, value, valueName, prefix) {
    const valueColIndex = table[HEADER_ROW].indexOf(valueName);
    const rowIndex = operations.getRowWithValue(table, columnName, value, prefix)
    if (rowIndex === -1) return null;
    return table[rowIndex][valueColIndex];
  };

  /**
  * Gets the row index of the first row with value in the valueName column.
  * @param {Array} table - The table to operate on
  * @param {string} valueName - The column header
  * @param {string} value - The value
  * @param {boolean} [prefix] - A flag to designate checking for prefix instead of matching
  */
  operations.getRowWithValue = function(table, columnName, value, prefix) {
    const valueColIndex = table[HEADER_ROW].indexOf(columnName);
    const colArray = table.map(row => row[valueColIndex]);
    if (!prefix) return colArray.indexOf(value);
    return colArray.reduce((ret, val, index) => {
      if (ret !== -1) return ret;
      if (val.toUpperCase().startsWith(value.toUpperCase())) return index;
      return -1;
    }, -1);
  };

  /**
  * Gets the row index of the last row with value in the valueName column.
  * @param {Array} table - The table to operate on
  * @param {string} valueName - The column header
  * @param {string} value - The value
  */
  operations.getLastRowWithValue = function(table, valueName, value) {
    const valueColIndex = table[HEADER_ROW].indexOf(valueName);
    const colArray = table.map(row => row[valueColIndex]);
    return colArray.lastIndexOf(value);
  };

  operations.authorizedCharacter = function(table, message, char) {
    const playerId = message.member.user.id;
    const charPlayerId = operations.getValue(table, ID_COLUMN, char, CHAR_COLUMN, true);
    return parseInt(playerId) === parseInt(charPlayerId);
  }

  /**
  * Adds a row of data to specified sheet and row location.
  * @param {Array} sheet - The sheet ID to add to
  * @param {string} data - array of data needed to be added from left to right.
  * @param {string} location - Row number needed to be added to. (0 for first row, 1 for last row)
  */
  operations.addRowToSheet = function(sheet, sheetId, data, location, message, log) {
    return operations.getSheet(sheet)
      .then((table) => {
        let req;
        let requests = [];

        if (location == 0) {
          req = utils.genInsertRowRequest(true, sheetId, 1, 2);
          requests.push(req);
          req = utils.genUpdateCellsRequest(data, sheetId, 1, 0);
          requests.push(req); 
        };

        operations.sendRequests(requests, message, log);
      });
  };

  /**
  * Adds logging from a specific message.
  * @param {message} initial message request
  */
  operations.addLogs = function(message) {
    var today = new Date();
    operations.addRowToSheet(LOGS_SHEET, LOGS_SHEET_ID, [message.author.id, message.author.username, today.toUTCString(), message.content], 0, message, true);
    return;
  }


  return operations;
};
