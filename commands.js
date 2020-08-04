module.exports = function() {
  const commands = {};
  const sheetOp = require('./sheetOperations.js')();
  const utils = require('./utils.js')();

  HEADER_ROW = 0;
  ID_COLUMN = 'ID';
  CHAR_COLUMN = 'CHAR_NAME';
  MXP_COLUMN = 'MXP'
  TIMELINE_START_COLUMN = 'TIMELINE_START';
  DEBUT_COLUMN = 'DEBUT';
  TIMELINE_ACTIVITY_PLACEHOLDER = '---'

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
      Promise.all([sheetOp.getSheet(CHARACTERS_SHEET), sheetOp.getSheet(TIMELINE_SHEET)])
        .then(([charactersTable, timelineTable]) => {
          let requests = [];
          requests = requests.concat(charactersRegistration(charactersTable));
          requests = requests.concat(timelineRegistration(timelineTable));
          return requests;
        })
        .then(sheetOp.sendRequests)
        .then(() => {
          resolve('Registered ' + charName + ' for ' + message.member.user.toString() + '.');
        })
        .catch((err) => {
          console.log('registerCharacter error: ' + err);
          resolve('Bot error: registering character failed.')
        });


      function charactersRegistration(table) {
        let idRowIdx = table[HEADER_ROW].indexOf(ID_COLUMN);
        let charNameRowIdx = table[HEADER_ROW].indexOf(CHAR_COLUMN);
        let requests = [];
        let playerRowIndex = sheetOp.getLastRowWithValue(table, ID_COLUMN, playerId, false);
        // New Player
        if (playerRowIndex === -1) {
          let req = utils.genUpdateCellsRequest([playerId], CHARACTERS_SHEET_ID, table.length, idRowIdx);
          requests.push(req);
          req = utils.genUpdateCellsRequest([charName], CHARACTERS_SHEET_ID, table.length, charNameRowIdx);
          requests.push(req);
          for (i = 2; i < table[HEADER_ROW].length; i++) {
            req = utils.genUpdateCellsRequest([0], CHARACTERS_SHEET_ID, table.length, i);
            requests.push(req);
          };
        }
        // Existing Player
        else {
          let req = utils.genInsertRowRequest(false, CHARACTERS_SHEET_ID, playerRowIndex, playerRowIndex + 1);
          requests.push(req);
          req = utils.genUpdateCellsRequest([playerId], CHARACTERS_SHEET_ID, playerRowIndex, idRowIdx);
          requests.push(req);
          req = utils.genUpdateCellsRequest([charName], CHARACTERS_SHEET_ID, playerRowIndex, charNameRowIdx);
          requests.push(req);
          for (i = 2; i < table[HEADER_ROW].length; i++) {
            req = utils.genUpdateCellsRequest([0], CHARACTERS_SHEET_ID, playerRowIndex, i);
            requests.push(req);
          };
        };
        return requests;
      }

      function timelineRegistration(table) {
        let charNameRowIdx = table[HEADER_ROW].indexOf(CHAR_COLUMN);
        let requests = [];
        const lastRow = table.length - 1;
        console.log(lastRow)
        const sheetId = TIMELINE_SHEET_ID;
        requests.push(utils.genInsertRowRequest(false, sheetId, lastRow, lastRow + 1));
        requests.push(utils.genUpdateCellsRequest([charName], sheetId, lastRow, charNameRowIdx));
        return requests;
      }
    });
  }

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

  /**
  * If multiple characters are advanced, sync all characters' timeline to
  * character farthest in the future with the downtime reason, then add the
  * number of days.
  */
  commands.advanceTimeline = function(args) {
    const daysIndex = args.findIndex(val => !isNaN(parseInt(val)));
    const chars = args.slice(0, daysIndex);
    const days = parseInt(args[daysIndex]);
    const startingDay = parseInt(args[daysIndex + 1]);
    const reason = args.slice(daysIndex + (isNaN(startingDay) ? 1 : 2)).join(' ');
    if (!(days && reason && chars.length)) return Promise.resolve('One of days, reason, or prefix was not provided.');
    // Ensure startingDay is after character farthest in the future.
    // If no character has debuted and startingDay is not defined... error.
    return sheetOp.getSheet(TIMELINE_SHEET)
      .then((table) => {
        let charRows = chars.map((char) => {
          return sheetOp.getRowWithValue(table, CHAR_COLUMN, char, true);
        });
        let charDays = chars.map((char) => {
          return getPresentDay(table, char);
        });
        if (!charDays.some(day => day !== -1) && isNaN(startingDay))
          return 'Every character is debuting but no starting day was provided.';
        let baseline = -1;
        charDays.forEach((day) => {
          baseline = Math.max(baseline, day);
        });

        const timelineStartIdx = table[HEADER_ROW].indexOf(TIMELINE_START_COLUMN);
        if (!isNaN(startingDay)) {
          if (baseline > startingDay + timelineStartIdx)
            return 'Given starting day was before ' + chars[charDays.indexOf(baseline)] + '\'s present day: day ' + (baseline - timelineStartIdx);
          baseline = startingDay + timelineStartIdx;
        }

        let requests = [];
        charDays.forEach((day, index) => {
          let values = [];
          if (day === -1) { // New character, fresh debut.
            const debutIdx = table[HEADER_ROW].indexOf(DEBUT_COLUMN);
            requests.push(utils.genUpdateCellsRequest([baseline], TIMELINE_SHEET_ID, charRows[index], debutIdx));
            day = baseline;
          }
          else if (day < baseline) { // Sync character to latest character by filling in with downtime.
            values = ['Downtime'];
            for (let i = day + 1; i < baseline; i++) {
              values.push(TIMELINE_ACTIVITY_PLACEHOLDER);
            }
          }
          values.push(reason);
          for (let i = baseline + 1; i < baseline + days; i++) {
            values.push(TIMELINE_ACTIVITY_PLACEHOLDER);
          }
          requests.push(utils.genUpdateCellsRequest(values, TIMELINE_SHEET_ID, charRows[index], day));
        });

        sheetOp.sendRequests(requests);
      })
      .then((msg) => {
        return msg ? msg : ('Timeline advanced for ' + chars.join(', '));
      })
      .catch((err) => {
        console.log(err);
        return 'Bot error: advancing timeline failed.'
      });

    /**
    * Get the character's current day. If a fresh character, stop.
    */
    function getPresentDay(table, charPrefix) {
      const charRow = sheetOp.getRowWithValue(table, CHAR_COLUMN, charPrefix, true);
      const debutIdx = table[HEADER_ROW].indexOf(DEBUT_COLUMN);
      const debutDay = parseInt(table[charRow][debutIdx]);
      if (isNaN(debutDay)) return -1;
      let day;
      for (day = debutDay; day < table[charRow].length; day++) {
        if (!table[charRow][day]) return day;
      }
      return day;
    }
  }

  /**
  * Query what a character is doing on a day.
  */
  commands.queryTimeline = function(args) {
    const day = parseInt(args[0]);
    const charPrefix = args[1];
    return sheetOp.getSheet(TIMELINE_SHEET)
      .then((table) => {
        const charRow = sheetOp.getRowWithValue(table, CHAR_COLUMN, charPrefix, true);
        if (charRow === -1) return 'Character doesn\'t exist.';
        const timelineStartIdx = table[HEADER_ROW].indexOf(TIMELINE_START_COLUMN);
        const debutIdx = table[HEADER_ROW].indexOf(DEBUT_COLUMN);
        if (day < table[charRow][debutIdx]) return 'Before debut.'
        if (table[charRow].length <= timelineStartIdx + day || !table[charRow][timelineStartIdx + day]) return 'Future';
        for (let i = timelineStartIdx + day; i >= timelineStartIdx; i--) {
          const activity = table[charRow][i];
          if (activity !== TIMELINE_ACTIVITY_PLACEHOLDER) return activity;
        }
        return 'Character has no timeline.';
      })
  }

  /**
  * Set the downtime activity for a stretch of free downtime.
  */
  commands.setDowntime = function(args) {

    //startingDay, days
  }

  return commands;
}
