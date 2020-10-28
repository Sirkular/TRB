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
  TIMELINE_START_COLUMN = 'TIMELINE_START';
  DEBUT_COLUMN = 'DEBUT';
  TIMELINE_ACTIVITY_PLACEHOLDER = '---';

  const MXP_THRESHOLDS = [0];
  for (let i = 1; i <= 20; i++) {
    const booster = Math.floor((i + 1) / 6)*10;
    MXP_THRESHOLDS.push(MXP_THRESHOLDS[i - 1] + i*10 + booster);
  }
  MXP_THRESHOLDS.push(Number.MAX_SAFE_INTEGER);

  commands.getCharacterInfo = function(message, args) {
    return new Promise((resolve, reject) => {
      let charName = args[0];
      if (!charName) resolve('No character name was given.')
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          if (!globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM]) &&
              !sheetOp.authorizedCharacter(table, message, charName))
            resolve('Not authorized to get the data of this character.');
          let mxp = parseInt(sheetOp.getValue(table, CHAR_COLUMN, charName, 'MXP', true));
          if (isNaN(mxp)) resolve('No character by that name exists.');
          let level = MXP_THRESHOLDS.indexOf(
            MXP_THRESHOLDS.find((th) => {
              return mxp <= th;
            })
          ) - 1;
          if (level === -1) level = 0;

          let out = 'Level: ' + level + '\n';
          out += 'Current MXP: ' + mxp + '\n';
          out += 'MXP to next level: ' + (MXP_THRESHOLDS[level + 1] - mxp) + '\n';
          resolve(out);
        }).catch((err) => {console.log('getCharacterInfo error: ' + err)});
    });
  };

  commands.getPlayerInfo = function(message, args) {
    let playerId = message.member.user.id;
    if (message.mentions.users.first()) playerId = message.mentions.users.first().id;
    return new Promise((resolve, reject) => {
      sheetOp.getSheet(PLAYERS_SHEET)
        .then((playerTable) => {
          let lifetimeTrb = parseInt(sheetOp.getValue(playerTable, ID_COLUMN, playerId, 'TRB_DM'))
            + parseInt(sheetOp.getValue(playerTable, ID_COLUMN, playerId, 'TRB_PLAYER'))
            + parseInt(sheetOp.getValue(playerTable, ID_COLUMN, playerId, 'TRB_SPECIAL'));
          let availableTrb = lifetimeTrb
            - parseInt(sheetOp.getValue(playerTable, ID_COLUMN, playerId, 'TRB_SPENT'))
            - parseInt(sheetOp.getValue(playerTable, ID_COLUMN, playerId, 'TRB_LOST'));

          if (isNaN(lifetimeTrb)) {
            lifetimeTrb = 0;
            availableTrb = 0;
          }
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
      Promise.all([sheetOp.getSheet(CHARACTERS_SHEET), sheetOp.getSheet(TIMELINE_SHEET)])
        .then(([charactersTable, timelineTable]) => {
          let requests = [];
          requests = requests.concat(charactersRegistration(charactersTable));
          requests = requests.concat(timelineRegistration(timelineTable));
          return requests;
        })
        .then((requests) => sheetOp.sendRequests(requests, message))
        .then(() => {
          resolve('Registered ' + charName + ' for ' + message.member.user.toString() + '.');
        })
        .catch((err) => {
          console.log('registerCharacter error: ' + err);
          resolve('Bot error: registering character failed.')
        });


      function charactersRegistration(table) {
        let headerTags = table[HEADER_ROW];
        let idRowIdx = headerTags.indexOf(ID_COLUMN);
        let charNameRowIdx = headerTags.indexOf(CHAR_COLUMN);
        let requests = [];
        let playerRowIndex = sheetOp.getLastRowWithValue(table, ID_COLUMN, playerId, false);
        // New Player
        if (playerRowIndex === -1) {
          let req = utils.genAppendDimRequest(CHARACTERS_SHEET_ID, true, 1);
          requests.push(req);

          let data = [];
          for (i = 0; i < headerTags.length; i++) {
            if (headerTags[i] === ID_COLUMN) data.push(playerId);
            else if (headerTags[i] === CHAR_COLUMN) data.push(charName);
            else data.push(0);
          }
          req = utils.genUpdateCellsRequest(data, CHARACTERS_SHEET_ID, table.length, 0);
          requests.push(req);
        }
        // Existing Player
        else {
          let req;
          if (playerRowIndex !== table.length - 1)
            req = utils.genInsertRowRequest(false, CHARACTERS_SHEET_ID, playerRowIndex, playerRowIndex + 1);
          else {
            req = utils.genAppendDimRequest(CHARACTERS_SHEET_ID, true, 1);
            playerRowIndex = table.length;
          }
          requests.push(req);

          let data = [];
          for (i = 0; i < headerTags.length; i++) {
            if (headerTags[i] === ID_COLUMN) data.push(playerId);
            else if (headerTags[i] === CHAR_COLUMN) data.push(charName);
            else data.push(0);
          }
          req = utils.genUpdateCellsRequest(data, CHARACTERS_SHEET_ID, playerRowIndex, 0);
          requests.push(req);
        }
        return requests;
      }

      function timelineRegistration(table) {
        let idRowIdx = table[HEADER_ROW].indexOf(ID_COLUMN);
        let charNameRowIdx = table[HEADER_ROW].indexOf(CHAR_COLUMN);
        let requests = [];
        const sheetId = TIMELINE_SHEET_ID;
        requests.push(utils.genAppendDimRequest(TIMELINE_SHEET_ID, true, 1));
        requests.push(utils.genUpdateCellsRequest([playerId], sheetId, table.length, idRowIdx));
        requests.push(utils.genUpdateCellsRequest([charName], sheetId, table.length, charNameRowIdx));
        return requests;
      }
    });
  }

  commands.registerPlayer = function(message, args) {
    return new Promise((resolve, reject) => {
      let playerName = message.member.user.tag;
      sheetOp.getSheet(PLAYERS_SHEET)
        .then((table) => {
          let requests = [];
          let headerTags = table[HEADER_ROW];
          let idRowIdx = headerTags.indexOf(ID_COLUMN);
          let numNewPlayers = 0;

          let playerList = args.slice(3);
          for (j = 0; j < playerList.length; j++) {
            let playerArr = [];
            let playerId = playerList[j].slice(3, -1);
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
              req = utils.genUpdateCellsRequest(playerArr, PLAYERS_SHEET_ID, table.length + numNewPlayers, idRowIdx);
              requests.push(req);
              numNewPlayers++;
            }
          }
          if (requests.length) {
            let req = utils.genAppendDimRequest(PLAYERS_SHEET_ID, table.length, numNewPlayers);
            requests.splice(0, 0, req);
            sheetOp.sendRequests(requests, message).then(() => {
              resolve('Registered ' + message.member.user.toString() + '.');
            }).catch(() => {
              resolve('Error registering player.');
            });
          }
          else resolve();
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
            sheetOp.sendRequests(requests, message).then(() => {
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
  * TODO: This needs to be refactored into addCharacterValue and addPlayerValue.
  * Add a numerical amount of a value to character(s)
  * args format: (valueName, amount, character prefixes...)
  */
  commands.addValue = function(message, args) {
    return new Promise((resolve, reject) => {
      let valueName = args[0].toUpperCase();
      if (!(valueName === 'MXP' || valueName === 'TRB')) resolve('Invalid resource.');
      let amount = 0;
      let characters = [];
      if (!isNaN(args[1])) {
        amount = parseInt(args[1]);
        characters = args.slice(2);
      } else {
        if (!args[1]) resolve('TRB type not provided.');
        valueName = valueName + "_" + args[1].toUpperCase();
        amount = parseInt(args[2]);
        if (valueName.toUpperCase() === 'SPENT') {
          amount = -amount;
        }
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
          const valueCol = table[HEADER_ROW].indexOf(valueName);
          let requests = [];
          for (let i = 0; i < characters.length; i++) {
            const character = characters[i];
            let charRow = sheetOp.getRowWithValue(table, columnId, character, true);
            if (charRow === -1) {
              resolve('One or more of the characters do not exist. No values were added.');
              return;
            }
            let curValue = table[charRow][valueCol] ? parseInt(table[charRow][valueCol]) : 0;
            let newValue = curValue + amount;
            let req = utils.genUpdateCellsRequest([newValue], sheetId, charRow, valueCol);
            requests.push(req);
          };
          sheetOp.sendRequests(requests, message).then(() => {
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

  commands.addPlayerValue = function(message, args) {
    return new Promise((resolve, reject) => {
      let valueName = args[0].toUpperCase();
      let amount = 0;
      let players = [];

      if (!args[1]) resolve('TRB type not provided.');
      valueName = valueName + "_" + args[1].toUpperCase();
      amount = parseInt(args[2]);
      args.slice(3).forEach((mention) => {
        players.push(mention.match(/\d+/).toString());
      });
      if (!valueName || isNaN(amount)) resolve('No resource name and/or amount was given.');
      else if (!players.length) resolve('No players were mentioned.');

      let sheetName = PLAYERS_SHEET;
      let sheetId = PLAYERS_SHEET_ID;
      let columnId = ID_COLUMN;
      sheetOp.getSheet(sheetName)
        .then((table) => {
          const valueCol = table[HEADER_ROW].indexOf(valueName);
          let requests = [];
          for (player of players) {
            let playerRow = sheetOp.getRowWithValue(table, columnId, player, true);
            // if (playerRow === -1) // Can never be true, since we register players before this.
            let curValue = table[playerRow][valueCol] ? parseInt(table[playerRow][valueCol]) : 0;
            let newValue = curValue + amount;
            if (valueName === 'TRB_SPENT') {
              let lifetimeTrb = parseInt(sheetOp.getValue(table, ID_COLUMN, player, 'TRB_DM'))
                + parseInt(sheetOp.getValue(table, ID_COLUMN, player, 'TRB_PLAYER'))
                + parseInt(sheetOp.getValue(table, ID_COLUMN, player, 'TRB_SPECIAL'));
              let availableTrb = lifetimeTrb
                - parseInt(sheetOp.getValue(table, ID_COLUMN, player, 'TRB_SPENT'))
                - parseInt(sheetOp.getValue(table, ID_COLUMN, player, 'TRB_LOST'));
              if (availableTrb - amount < 0) {
                resolve('You do not have enough TRB for this expenditure.');
                return;
              }
            }
            let req = utils.genUpdateCellsRequest([newValue], sheetId, playerRow, valueCol);
            requests.push(req);
          };
          sheetOp.sendRequests(requests, message).then(() => {
            resolve('Successfully modified values.');
          }).catch(() => {
            resolve('Error modifying values.');
          });
        }).catch((err) => {
          console.error('addPlayerValue error: ' + err);
          resolve('Error modifying values.');
        });
    });
  }

  /**
  * If multiple characters are advanced, sync all characters' timeline to
  * character farthest in the future with the downtime reason, then add the
  * number of days.
  */
  commands.advanceTimeline = function(message, args, setPeriod) {
    const numIndex = args.findIndex(val => !isNaN(parseInt(val)));
    const chars = args.slice(0, numIndex);
    if (!setPeriod && !isNaN(parseInt(args[numIndex]) + parseInt(args[numIndex + 1])))
      return Promise.resolve('A starting day cannot be provided with advance.');
    const days = parseInt(args[numIndex + (setPeriod ? 1 : 0)]);
    const startingDay = setPeriod ? parseInt(args[numIndex]) : NaN;
    const reason = args.slice(numIndex + (setPeriod ? 2 : 1)).join(' ');
    if ((isNaN(days) || isNaN(startingDay)) && setPeriod) return Promise.resolve('Either days or startingDay not provided.');
    if (isNaN(days)) return Promise.resolve('Days not provided or is not a number.');
    if (isNaN(startingDay) && setPeriod) return Promise.resolve('Starting day not provided or is not a number.');
    if (!chars.length) return Promise.resolve('No character prefix(es) were provided.');
    if (!reason) return Promise.resolve('No activity was provided.');

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

        let lowest = charDays[0];
        let baseline = -1;
        charDays.forEach((day) => {
          lowest = Math.min(lowest, day);
          baseline = Math.max(baseline, day);
        });
        const timelineStartIdx = table[HEADER_ROW].indexOf(TIMELINE_START_COLUMN);

        // Check for large disparities between characters
        if (baseline - lowest >= 7) {
          let combined = chars.map((char, index) => {
            return {char: char, day: charDays[index] - timelineStartIdx};
          }).sort((a, b) => {
            return a.day - b.day;
          }).reduce((out, val) => {
            return out + val.char + ' : ' + val.day.toString() + '\n';
          }, 'Character Present Days\n');
          combined += 'Do you want to proceed with advancing the timeline? ' +
          'Respond with `override` to proceed or anything else to stop.';
          return message.channel.send(combined).then(() => {
            const filter = response => {
              return response.author.id === message.author.id;
            };
            return message.channel.awaitMessages(filter, {max: 1, time: 30000, errors: ['time']})
              .then(collected => {
                if (collected.first().content.toLowerCase() === 'override')
                  return executeUpdates();
                return 'Stopped. No changes were made.';
              })
              .catch(collected => {
                return 'Override timed out. No changes were made.';
              });
          });
        }
        return executeUpdates();


        function executeUpdates() {
          if (!isNaN(startingDay)) {
            if (baseline > startingDay + timelineStartIdx)
              return 'Given starting day was before ' + chars[charDays.indexOf(baseline)] + '\'s present day: day ' + (baseline - timelineStartIdx);
            baseline = startingDay + timelineStartIdx;
          }

          let requests = [];

          if (table[HEADER_ROW].length < baseline + days) {
            let values = [];
            for (let i = table[HEADER_ROW].length; i < baseline + days; i++) {
              values.push('Day ' + (i - timelineStartIdx));
            }
            requests.push(utils.genAppendDimRequest(TIMELINE_SHEET_ID, false, baseline + days - table[HEADER_ROW].length));
            requests.push(utils.genUpdateCellsRequest(values, TIMELINE_SHEET_ID, HEADER_ROW, table[HEADER_ROW].length));
          }

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

          sheetOp.sendRequests(requests, message);
        }
      })
      .then((msg) => {
        return msg ? msg : ('Timeline advanced for ' + chars.join(', '));
      })
      .catch((err) => {
        console.log(err);
        return 'Bot error: advancing timeline failed.'
      });
  }

  /**
  * Get the character's current day. If a fresh character, stop.
  */
  function getPresentDay(table, char) {
    const charRow = sheetOp.getRowWithValue(table, CHAR_COLUMN, char, true);
    const debutIdx = table[HEADER_ROW].indexOf(DEBUT_COLUMN);
    const debutDay = parseInt(table[charRow][debutIdx]);
    if (isNaN(debutDay)) return -1;
    let day;
    for (day = debutDay; day < table[charRow].length; day++) {
      if (!table[charRow][day]) return day;
    }
    return day;
  }

  /**
  * Query what a character is doing on a day.
  */
  commands.queryTimeline = function(args) {
    const day = parseInt(args[1]);
    const char = args[0];
    if (day && isNaN(day)) return Promise.resolve('Day must be a number.');
    if (!char) return Promise.resolve('No character specified.');
    return sheetOp.getSheet(TIMELINE_SHEET)
      .then((table) => {
        const charRow = sheetOp.getRowWithValue(table, CHAR_COLUMN, char, true);
        if (charRow === -1) return 'Character doesn\'t exist.';
        const timelineStartIdx = table[HEADER_ROW].indexOf(TIMELINE_START_COLUMN);
        const debutIdx = table[HEADER_ROW].indexOf(DEBUT_COLUMN);
        if (isNaN(parseInt(table[charRow][debutIdx]))) return 'Character has not debuted.'
        if (day < parseInt(table[charRow][debutIdx]) - timelineStartIdx) return 'Before debut.'
        if (isNaN(day)) return 'Present day: ' + (getPresentDay(table, char) - timelineStartIdx);
        if (table[charRow].length <= timelineStartIdx + day || !table[charRow][timelineStartIdx + day]) return 'After present day.';
        for (let i = timelineStartIdx + day; i >= timelineStartIdx; i--) {
          const activity = table[charRow][i];
          if (activity !== TIMELINE_ACTIVITY_PLACEHOLDER) return activity;
        }
        return 'Character has no timeline.';
      })
  }

  function getStretch(row) {
    const activity = row[0];
    for (let i = 1; i < row.length; i++) {
      if (row[i] !== TIMELINE_ACTIVITY_PLACEHOLDER &&
          row[i].toUpperCase() !== activity.toUpperCase())
          return i;
    }
    return row.length;
  }

  function findAllDowntime(table, char) {
    const charRow = sheetOp.getRowWithValue(table, CHAR_COLUMN, char, true);
    const allDowntime = {};
    let timeline = table[charRow];

    timeline.forEach((activity, day) => {
      if (activity.toUpperCase() === 'DOWNTIME') {
        allDowntime[day] = getStretch(timeline.slice(day))
      }
    });
    return allDowntime;
  }

  /**
  * Set the downtime activity for a stretch of free downtime.
  */
  commands.spendDowntime = function(message, [char, days, ...reason]) {
    days = parseInt(days);
    if (!char) return Promise.resolve('No character prefix was provided.');
    if (isNaN(days)) return Promise.resolve('An invalid number of days was provided.');
    if (!reason.length) return Promise.resolve('No reason was provided.');
    reason = reason.join(' ');
    return sheetOp.getSheet(TIMELINE_SHEET)
      .then((table) => {
        const downtimeMap = findAllDowntime(table, char);
        if (!Object.values(downtimeMap).length || days > Object.values(downtimeMap).reduce((sum, val) => {return sum + val}))
          return Promise.reject('Not enough downtime days.');

        const charRow = sheetOp.getRowWithValue(table, CHAR_COLUMN, char, true);
        const requests = [];
        for (let [key, value] of Object.entries(downtimeMap)) {
          key = parseInt(key);
          let values = [];
          requests.push(utils.genUpdateCellsRequest([reason + ' (Downtime)'], TIMELINE_SHEET_ID, charRow, key));
          if (days <= value) {
            if (value !== days)
              requests.push(utils.genUpdateCellsRequest(['Downtime'], TIMELINE_SHEET_ID, charRow, key + days));
            break;
          }
          else days -= value;
        }

        return requests;
      })
      .then((requests) => sheetOp.sendRequests(requests, message))
      .then((res, err) => {
        if (err) {
          console.log(err);
          return 'Bot error: spending downtime failed.';
        }
        return 'Downtime spent successfully.';
      })
      .catch((err) => {
        return err;
      });
  }

  commands.queryDowntime = function(message, char, day) {
    if (!char) return Promise.resolve('No character prefix was provided.');
    day = parseInt(day);
    return sheetOp.getSheet(TIMELINE_SHEET)
      .then((table) => {
        if (!globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM]) &&
            !sheetOp.authorizedCharacter(table, message, char))
          return 'Not authorized to get the data of this character.';
        const downtimeObj = findAllDowntime(table, char);
        const downtimeMap = Object.values(downtimeObj);
        let downtime;
        if (!downtimeMap.length) downtime = 0;
        else if (!isNaN(day)) {
          downtime = 0;
          const timelineStartIdx = table[HEADER_ROW].indexOf(TIMELINE_START_COLUMN);
          Object.entries(downtimeObj).forEach(([index, stretch]) => {
            const actualDay = index - timelineStartIdx;
            if (actualDay + stretch <= day) downtime += stretch;
            else downtime += Math.max(day - actualDay, 0);
          });
        }
        else downtime = Object.values(downtimeMap).reduce((sum, val) => {return sum + val});
        const charRow = sheetOp.getRowWithValue(table, CHAR_COLUMN, char, true);
        return table[charRow][table[HEADER_ROW].indexOf(CHAR_COLUMN)] + ' has '+ downtime + ' downtime days.';
      })
      .catch((err) => {
        console.log(err);
        return 'Bot error: querying downtime failed.';
      });
  }

  return commands;
}
