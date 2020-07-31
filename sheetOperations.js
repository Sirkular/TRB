module.exports = function() {
  const operations = {};
  const HEADER_ROW = 0;
  const ID_COLUMN = "ID";
  const CHAR_COLUMN = "CHAR_NAME";
  const MXP_COLUMN = "MXP"

  let sheets;
  let auth;
  require('./googleAuth.js')().then((googleAuth) => {
    sheets = googleAuth.google.sheets('v4');
    auth = googleAuth.auth;
  });

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
  }

  /**
  * Gets a value for a character.
  * @param {string} charName - A character's nameChange
  * @param {string} valueName - The name of the value to query
  */
  operations.getCharacterValue = function(table, charName, valueName) {
    const valueColIndex = table[HEADER_ROW].indexOf(valueName);
    const charRowIndex = operations.getRowWithValue(table, CHAR_COLUMN, charName)
    if (charRowIndex === -1) return null;
    return table[charRowIndex][valueColIndex];
  };

  operations.getPlayerValue = function(table, playerId, valueName) {

  };

  /**
  * Gets the row index of the first row with value in the valueName column.
  * @param {string} valueName - The column header
  * @param {string} value - The value
  */
  operations.getRowWithValue = function(table, valueName, value) {
    const valueColIndex = table[HEADER_ROW].indexOf(valueName);
    return table.map(row => row[valueColIndex]).indexOf(value);
  }

  return operations;
}
