module.exports = function() {
  let utils = {};

  const Discord = require('discord.js');

  utils.genBatchUpdateBody = function(auth, requests) {
    return {
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: requests,
        includeSpreadsheetInResponse: false
      },
      auth: auth
    };
  };

  /* values is an array of string or int to be pushed in.
  */
  utils.genUpdateCellsRequest = function(values, sheetId, rowIndex, columnIndex) {
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

  utils.genInsertRowRequest = function(inherit, sheetId, startIndex, endIndex) {
    return {
      insertDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: startIndex,
          endIndex: endIndex
        },
        inheritFromBefore: inherit
      }
    }
  }

  utils.genInsertColumnRequest = function(inherit, sheetId, startIndex, endIndex) {
    return {
      insertDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'COLUMNS',
          startIndex: startIndex,
          endIndex: endIndex
        },
        inheritFromBefore: inherit
      }
    }
  }

  utils.genDeleteRowRequest = function(sheetId, startIndex, endIndex) {
    return {
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: startIndex,
          endIndex: endIndex
        }
      }
    }
  }

  utils.genDeleteColumnRequest = function(sheetId, startIndex, endIndex) {
    return {
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'COLUMNS',
          startIndex: startIndex,
          endIndex: endIndex
        }
      }
    }
  }

  // row is a boolean, num is the number of rows/cols to add
  utils.genAppendDimRequest = function(sheetId, row, num) {
    return {
      appendDimension: {
        sheetId: sheetId,
        dimension: row ? 'ROWS' : 'COLUMNS',
        length: num
      }
    }
  }

  // Constructs new Embeded projects with specified parameters.
  utils.constructEmbed = function(title, desc, color) {
    if (!title) {
      title = '';
    }

    if (!desc) {
      desc = '';
    }

    if (!color) {
      color = '#0099ff';
    }

    const embed = new Discord.MessageEmbed()
      .setTitle(title)
      .setColor(color)
      .setDescription(desc)
    ;

    return embed;
  }

  return utils;
}
