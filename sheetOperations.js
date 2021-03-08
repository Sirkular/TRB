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
    const charPlayerId = operations.getValue(table, CHAR_COLUMN, char, ID_COLUMN, true);
    return parseInt(playerId) === parseInt(charPlayerId);
  }

  /**
  * Compares multiple parameters to rows to find match and returns index and array for first matched values.
  * @param {2D Array} table - Table array to search.
  * @param {Object} location - Object with key indicating column name and value to compare to for location placement.
  */
  operations.searchRowAndIndex = function(table, location) {
    let row, data;
    let columnHdr = table[HEADER_ROW];

    for (let i = 1; i < table.length; i++) {
      let isRow = true;
      for (let [key, value] of Object.entries(location)) {
        if (table[i][columnHdr.indexOf(key)] != value) {
          isRow = false;
        };
      };
      if (isRow) {
        row = i;
        data = table[i];
        continue;
      };
    };

    return [row, data];
  }

  /**
  * Adds a row of data to specified sheet and row location.
  * @param {string} sheet - The sheet name to add to
  * @param {string} sheetId - The sheet ID to add to
  * @param {Array} data - array of data needed to be added from left to right.
  * @param {integer} location - Row number needed to be added to. (0 for first row, 1 for last row)
  * @param {Object} message - Discord message object
  * @param {boolean} log - true if adding for logging purposes
  */
  operations.addRowToSheet = function(table, requests, sheetId, data, location, message, log) {
    let req;

    if (location == 0) {
      req = utils.genInsertRowRequest(true, sheetId, 1, 2);
      requests.push(req);
      req = utils.genUpdateCellsRequest(data, sheetId, 1, 0);
      requests.push(req);
    }
    else if (location == 1) {
      req = utils.genInsertRowRequest(true, sheetId, table.length, table.length + 1);
      requests.push(req);
      req = utils.genUpdateCellsRequest(data, sheetId, table.length, 0);
      requests.push(req);
    }
    else {
      req = utils.genInsertRowRequest(true, sheetId, location, location + 1);
      requests.push(req);
      req = utils.genUpdateCellsRequest(data, sheetId, location, 0);
      requests.push(req);
    };

    return requests;
  };

  /**
  * Adds to request an entire row's worth of updates according to 'update' object.
  * @param {string} sheet - The sheet name to add to
  * @param {string} sheetId - The sheet ID to add to
  * @param {Object} location - Object with key indicating column name and value to compare to for location placement.
  * @param {Object} updates - Object with key indicating column name and value as value to update column to.
  * @param {Object} message - Discord message object
  */
  operations.updateRowOnSheet = function(table, requests, sheetId, location, updates, message) {
    let req;
    let columnHdr = table[HEADER_ROW];

    let searchResult = operations.searchRowAndIndex(table, location);

    if (!searchResult) {
      requests = null;
      return requests;
    }

    let row = searchResult[0];
    let data = searchResult[1];

    if (typeof data == 'undefined') {
      return null;
    };

    for (let [key, value] of Object.entries(updates)) {
      data[columnHdr.indexOf(key)] = value;
    };

    req = utils.genUpdateCellsRequest(data, sheetId, row, 0);
    requests.push(req);

    return requests;
  };


  /**
  * Adds logging from a specific message.
  * @param {message} initial message request
  */
  operations.addLogs = function(message) {
    if (!message) return;
    var today = new Date();
    let requests = [];
    operations.getSheet(LOGS_SHEET)
      .then((table) => {

      operations.addRowToSheet(table, requests, LOGS_SHEET_ID, [message.author.id, message.author.username, today.toUTCString(), message.content],
        0, message, true);
      operations.sendRequests(requests, message, true);
    });
    return;
  }


  return operations;
};
