module.exports = function() {
  const commands = {};
  const sheetOp = require('./sheetOperations.js')();
  const utils = require('./utils.js')();

  HEADER_ROW = 0;
  ID_COLUMN = 'ID';
  CHAR_COLUMN = 'CHAR_NAME';
  MXP_COLUMN = 'MXP'
  HEADER_TAGS = [ID_COLUMN, CHAR_COLUMN, MXP_COLUMN]

  const MXP_THRESHOLDS = [0];
  for (let i = 1; i <= 20; i++) {
    const booster = Math.floor((i + 1) / 6)*10;
    MXP_THRESHOLDS.push(MXP_THRESHOLDS[i - 1] + i*10 + booster);
  }
  MXP_THRESHOLDS.push(Number.MAX_SAFE_INTEGER);

  commands.getCharacterInfo = function(args) {
    return new Promise((resolve, reject) => {
      let charName = args[0];
      if (!charName) resolve('No character name was given.')
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          let mxp = parseInt(sheetOp.getCharacterValue(table, charName, 'MXP', true));
          if (mxp === null) resolve('No character by that name exists.');
          let level = MXP_THRESHOLDS.indexOf(
            MXP_THRESHOLDS.find((th) => {
              return mxp <= th;
            })
          ) - 1;
          let out = 'Level: ' + level + '\n';
          out += 'Current MXP: ' + mxp + '\n';
          out += 'MXP to next level: ' + (MXP_THRESHOLDS[level + 1] - mxp) + '\n';
          resolve(out);
        }).catch((err) => {console.log('getCharacterInfo error: ' + err)});
    });
  };

  commands.registerCharacter = function(message, args) {
    return new Promise((resolve, reject) => {
      let charName = args.slice(1).join(' ');
      let playerId = message.member.user.id;
      let playerName = message.member.user.tag;
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          let requests = [];
          let playerRowIndex = sheetOp.getRowWithValueLast(table, ID_COLUMN, playerId, false);
          // New Player
          if (playerRowIndex === -1) {
            let req = utils.genUpdateCellsRequest([playerId], CHARACTERS_SHEET_ID, table.length, 0);
            requests.push(req);
            req = utils.genUpdateCellsRequest([charName], CHARACTERS_SHEET_ID, table.length, 1);
            requests.push(req);
            for (i = 2; i < HEADER_TAGS.length; i++) {
              req = utils.genUpdateCellsRequest([0], CHARACTERS_SHEET_ID, table.length, i);
              requests.push(req);
            };
          }
          // Existing Player
          else {
            let req = utils.genInsertRowRequest(false, CHARACTERS_SHEET_ID, playerRowIndex + 1, playerRowIndex + 2);
            requests.push(req);
            req = utils.genUpdateCellsRequest([playerId], CHARACTERS_SHEET_ID, playerRowIndex + 1, 0);
            requests.push(req);
            req = utils.genUpdateCellsRequest([charName], CHARACTERS_SHEET_ID, playerRowIndex + 1, 1);
            requests.push(req);
            for (i = 2; i < HEADER_TAGS.length; i++) {
              req = utils.genUpdateCellsRequest([0], CHARACTERS_SHEET_ID, playerRowIndex + 1, i);
              requests.push(req);
            };
          };

          
          sheetOp.sendRequests(requests).then(() => {
            resolve('Successfully added values.');
          }).catch(() => {
            resolve('Error registering character.');
          });
        }).catch((err) => {console.log('registerCharacter error: ' + err)});
      resolve('Registered ' + charName + ' for ' + message.member.user.toString() + '.')
    });
  }

  /**
  * Add a numerical amount of a value to character(s)
  * args format: (valueName, amount, character prefixes...)
  */
  commands.addCharacterValue = function(args) {
    return new Promise((resolve, reject) => {
      let valueName = args[0].toUpperCase();
      let amount = parseInt(args[1]);
      let characters = args.slice(2);
      if (!(valueName && amount)) resolve('No resource name and/or amount was given.');
      else if (!characters.length) resolve('No character names or prefixes were given.');
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          let requests = [];
          characters.forEach((character) => {
            let charRow = sheetOp.getRowWithValue(table, CHAR_COLUMN, character, true);
            if (charRow === -1) resolve('One or more of the characters do not exist. No values were added.');
            let valueCol = table[HEADER_ROW].indexOf(valueName);
            let curValue = table[charRow][valueCol] ? parseInt(table[charRow][valueCol]) : 0;
            let newValue = curValue + amount;
            let req = utils.genUpdateCellsRequest([newValue], CHARACTERS_SHEET_ID, charRow, valueCol);
            requests.push(req);
          });
          sheetOp.sendRequests(requests).then(() => {
            resolve('Successfully added values.');
          }).catch(() => {
            resolve('Error adding value to character(s).');
          });
        }).catch((err) => {
          console.error('addCharacterValue error: ' + err);
          resolve('Error adding value to character(s).');
        });
    });
  }

  return commands;
}
