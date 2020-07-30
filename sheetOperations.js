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
    return new Promise(function(resolve, reject) {
      const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: sheet,
        auth: auth
      }
      resolve(sheets.spreadsheets.values.get(request).data);
    });
  }

  /**
  * Gets a value for a character.
  * @param {string} charName - A character's nameChange
  * @param {string} valueName - The name of the value to query
  */
  operations.getCharacterValue = function(sheetObj, charName, valueName) {
    const charColIndex = sheetObj[HEADER_ROW].indexOf(CHAR_COLUMN);
    const valueColIndex = sheetObj[HEADER_ROW].indexOf(valueName);
    const charRowIndex = sheetObj.map(row => row[charColIndex]).indexOf(charName);
    if (charRowIndex === -1) return null;
    return sheetObj[charRowIndex][valueColIndex];
  };

  operations.getPlayerValue = function(sheetObj, playerId, valueName) {

  };

  return operations;
}
