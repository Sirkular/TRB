module.exports = function() {
  const commands = {};
  const sheetOp = require('./sheetOperations.js')();
  const utils = require('./utils.js')();

  HEADER_ROW = 0;
  ID_COLUMN = 'ID';
  CHAR_COLUMN = 'CHAR_NAME';
  MXP_COLUMN = 'MXP';
  TRB_DM_COLUMN = 'TRB_DM';
  TRB_PLAYER_COLUMN = 'TRB_PLAYER';
  TRB_SPECIAL_COLUMN = 'TRB_SPECIAL';
  TRB_SPENT_COLUMN = 'TRB_SPENT';
  TRB_LOST_COLUMN = 'TRB_LOST;'

  const MXP_THRESHOLDS = [0];
  for (let i = 1; i <= 20; i++) {
    const booster = Math.floor((i + 1) / 6)*10;
    MXP_THRESHOLDS.push(MXP_THRESHOLDS[i - 1] + i*10 + booster);
  }
  MXP_THRESHOLDS.push(Number.MAX_SAFE_INTEGER);

  commands.getCharacterInfo = function(message, args) {
    return new Promise((resolve, reject) => {
      let charName = args[0];
      let playerId = message.member.user.id;
      if (!charName) resolve('No character name was given.')
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          let mxp = parseInt(sheetOp.getValue(table, CHAR_COLUMN, charName, 'MXP', true));
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

  commands.getPlayerInfo = function(message, args) {
    return new Promise((resolve, reject) => {
      let playerId = message.member.user.id;
      sheetOp.getSheet(PLAYERS_SHEET)
        .then((player_table) => {
          let lifetimeTrb = parseInt(sheetOp.getValue(player_table, ID_COLUMN, playerId, 'TRB_DM'))
            + parseInt(sheetOp.getValue(player_table, ID_COLUMN, playerId, 'TRB_PLAYER'))
            + parseInt(sheetOp.getValue(player_table, ID_COLUMN, playerId, 'TRB_SPECIAL'));
          let availableTrb = lifetimeTrb
            - parseInt(sheetOp.getValue(player_table, ID_COLUMN, playerId, 'TRB_SPENT'))
            - parseInt(sheetOp.getValue(player_table, ID_COLUMN, playerId, 'TRB_LOST'));

          let out = 'Available TRB: ' + availableTrb + '\n';
          out += 'Lifetime TRB: ' + lifetimeTrb + '\n';
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
          let headerTags = table[HEADER_ROW];
          let idRowIdx = headerTags.indexOf(ID_COLUMN);
          let charNameRowIdx = headerTags.indexOf(CHAR_COLUMN);
          let playerRowIndex = sheetOp.getLastRowWithValue(table, ID_COLUMN, playerId, false);
          // New Player
          if (playerRowIndex === -1) {
            let playerArr = [];
            for (i = 0; i < headerTags.length; i++) {
              if (headerTags[i] === ID_COLUMN) {
                playerArr.push(playerId);
              }
              else if (headerTags[i] === CHAR_COLUMN) {
                playerArr.push(charName);
              }
              else {
                playerArr.push(0);
              }
            }
            let req = utils.genAppendDimRequest(CHARACTERS_SHEET_ID, table.length, 1);
            requests.push(req);
            req = utils.genUpdateCellsRequest(playerArr, CHARACTERS_SHEET_ID, table.length, idRowIdx);
            requests.push(req);
          }
          // Existing Player
          else {
            let playerArr = [];
            for (i = 0; i < headerTags.length; i++) {
              if (headerTags[i] === ID_COLUMN) {
                playerArr.push(playerId);
              }
              else if (headerTags[i] === CHAR_COLUMN) {
                playerArr.push(charName);
              }
              else {
                playerArr.push(0);
              }
            }
            let req = utils.genInsertRowRequest(false, CHARACTERS_SHEET_ID, playerRowIndex + 1, playerRowIndex + 2);
            requests.push(req);
            req = utils.genUpdateCellsRequest(playerArr, CHARACTERS_SHEET_ID, playerRowIndex + 1, idRowIdx);
            requests.push(req);
          };
          
          sheetOp.sendRequests(requests).then(() => {
            resolve('Registered ' + charName + ' for ' + message.member.user.toString() + '.');
          }).catch(() => {
            resolve('Error registering character.');
          });
        }).catch((err) => {console.log('registerCharacter error: ' + err)});
    });
  }

  commands.registerPlayer = function(message, args) {
    return new Promise((resolve, reject) => {
      let playerId = message.member.user.id;
      let playerName = message.member.user.tag;
      sheetOp.getSheet(PLAYERS_SHEET)
        .then((table) => {
          let requests = [];
          let headerTags = table[HEADER_ROW];
          let idRowIdx = headerTags.indexOf(ID_COLUMN);
          let playerArr = [];
          let newPlayer = true;
          for (i = 0; i < table.length; i++) {
            if (table[i][idRowIdx] == playerId) {
              newPlayer = false;
            }
          }

          if (newPlayer) {
            for (i = 0; i < headerTags.length; i++) {
              if (headerTags[i] === ID_COLUMN) {
                playerArr.push(playerId);
              }
              else {
                playerArr.push(0);
              }
            }
            let req = utils.genAppendDimRequest(PLAYERS_SHEET_ID, table.length, 1);
            requests.push(req)
            req = utils.genUpdateCellsRequest(playerArr, PLAYERS_SHEET_ID, table.length, idRowIdx);
            requests.push(req);

            sheetOp.sendRequests(requests).then(() => {
              resolve('Registered ' + message.member.user.toString() + '.');
            }).catch(() => {
              resolve('Error registering player.');
            });
          }
        }).catch((err) => {console.log('registerPlayer error: ' + err)});
    })
  };

  commands.deleteCharacter = function(message, args) {
    return new Promise((resolve, reject) => {
      let charName = args.slice(1).join(' ');
      let playerId = message.member.user.id;
      let playerName = message.member.user.tag;
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          let idRowIdx = table[HEADER_ROW].indexOf(ID_COLUMN);
          let charNameRowIdx = table[HEADER_ROW].indexOf(CHAR_COLUMN);
          let requests = [];
          for (i = 1; i < table.length; i++) {
            if (table[i][idRowIdx] === playerId && table[i][charNameRowIdx] === charName) {
              let req = utils.genDeleteRowRequest(CHARACTERS_SHEET_ID, i, i + 1);
              requests.push(req);
              break;
            };
          };

          // No rows found with matching discord id and character name
          if (requests.length === 0) {
            resolve('No character exists for ' + message.member.user.toString() + ' named: ' + charName);
          }
          else {
            sheetOp.sendRequests(requests).then(() => {
              resolve('Successfully deleted character.');
            }).catch(() => {
              resolve('Error deleting character.');
            });
            resolve('Deleted ' + charName + ' for ' + message.member.user.toString() + '.')
          }
        }).catch((err) => {console.log('deleteCharacter error: ' + err)});
    });
  }

  commands.listCharacter = function(message, args) {
    return new Promise((resolve, reject) => {
      let playerId = message.member.user.id;
      let playerName = message.member.user.tag;
      let charList = [];
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          let idRowIdx = table[HEADER_ROW].indexOf(ID_COLUMN);
          let charNameRowIdx = table[HEADER_ROW].indexOf(CHAR_COLUMN);
          for (i = 1; i < table.length; i++) {
            if (table[i][idRowIdx] === playerId) {
              charList.push(table[i][charNameRowIdx]);
            };
          };

          if (charList.length === 0) {
            resolve(message.member.user.toString() + ' has no characters registered yet!');
          };

          resolve('Registered characters for ' + message.member.user.toString() + ': ' + charList.join(', '));
        }).catch((err) => {console.log('listCharacter error: ' + err)});
    });
  }

  /**
  * Add a numerical amount of a value to character(s)
  * args format: (valueName, amount, character prefixes...)
  */
  commands.addValue = function(args) {
    return new Promise((resolve, reject) => {
      let valueName = args[0].toUpperCase();
      let amount = 0;
      let characters = [];
      if (!isNaN(args[1])) {
        amount = parseInt(args[1]);
        characters = args.slice(2);
      } else {
        valueName = valueName + "_" + args[1].toUpperCase();
        amount = parseInt(args[2]);
        args.slice(3).forEach((mention) => {
          characters.push(mention.match(/\d+/).toString());
        });
      }
      if (!(valueName && amount)) resolve('No resource name and/or amount was given.');
      else if (!characters.length) resolve('No character names or prefixes were given.');
      let sheetName = "";
      let sheetId = "";
      let columnId = 0;
      if (valueName === 'MXP') {
        sheetName = CHARACTERS_SHEET;
        sheetId = CHARACTERS_SHEET_ID;
        columnId = CHAR_COLUMN;
      }
      else {
        sheetName = PLAYERS_SHEET;
        sheetId = PLAYERS_SHEET_ID;
        columnId = ID_COLUMN;
      }

      sheetOp.getSheet(sheetName)
        .then((table) => {
          let requests = [];
          characters.forEach((character) => {
            let charRow = sheetOp.getRowWithValue(table, columnId, character, true);
            if (charRow === -1) resolve('One or more of the characters do not exist. No values were added.');
            let valueCol = table[HEADER_ROW].indexOf(valueName);
            let curValue = table[charRow][valueCol] ? parseInt(table[charRow][valueCol]) : 0;
            let newValue = curValue + amount;
            let req = utils.genUpdateCellsRequest([newValue], sheetId, charRow, valueCol);
            requests.push(req);
          });
          sheetOp.sendRequests(requests).then(() => {
            resolve('Successfully added values.');
          }).catch(() => {
            resolve('Error adding value to character(s).');
          });
        }).catch((err) => {
          console.error('addValue error: ' + err);
          resolve('Error adding value to character(s).');
        });
    });
  }

  return commands;
}
