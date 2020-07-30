module.exports = function() {
  let utils = {};

  utils.genBatchUpdateBody = function(requests) {
    return {
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: requests,
        includeSpreadsheetInResponse: false
      }
    };
  };

  /* values is an array of string or int to be pushed in.
  */
  utils.genUpdateCells = function(values, sheetId, rowIndex, columnIndex) {
    var vals = [];
    for (let i = 0; i < values.length; i++) {
      if (!(typeof values[i] == 'number')) {
        vals.push({
            userEnteredValue: { stringValue: values[i] }
        });
      }
      else {
        vals.push({
          userEnteredValue: { numberValue: values[i] }
        });
      }
    }
    return {
      updateCells: {
        rows: [
          { values: vals }
        ],
        fields: "userEnteredValue",
        start: {
          sheetId: sheetId,
          rowIndex: rowIndex,
          columnIndex: columnIndex
        }
      }
    };
  };

  return utils;
}
