module.exports = function() {
  const commands = {};
  const sheetOp = require('./sheetOperations.js')();
  const utils = require('./utils.js')();

  const nodeSchedule = require('node-schedule');
  const scpMonthlyJob = nodeSchedule.scheduleJob('0 0 1 * *', commands.scpMonthlyManual);
  commands.scpMonthlyManual = function() {
    const TRB_GUILD_ID = '722115343862202368';
    const TRB = globe.discordClient.guilds.cache.find(guild => guild.id == TRB_GUILD_ID);
    const botFeedbackChannel = TRB.channels.cache.find(channel => channel.name.toLowerCase() == 'bot-feedback'.toLowerCase());
    commands.scpMonthly(TRB).then((out) => botFeedbackChannel.send(out));
  }

  HEADER_ROW = 0;
  ID_COLUMN = 'ID';
  CHAR_COLUMN = 'CHAR_NAME';
  MXP_COLUMN = 'MXP';
  RACE_COLUMN = 'RACE';
  SUBRACE_COLUMN = 'SUBRACE';
  GENDER_COLUMN = 'GENDER';
  CLASS_COLUMN = 'CLASS';
  CUMULATIVE_LEVEL_COLUMN = 'CUMULATIVE_LEVEL'
  STATUS_COLUMN = 'STATUS';
  NATIVE_COLUMN = 'NATIVE';
  REGION_COLUMN = 'REGION';
  VAULT_COLUMN = 'VAULT';
  BACKGROUND_COLUMN = 'BACKGROUND';
  ALIGNMENT_COLUMN = 'ALIGNMENT';
  BACKSTORY_COLUMN = 'BACKSTORY';
  IMAGE_COLUMN = 'IMAGE';
  HERO_POINTS_COLUMN = 'HERO_POINTS';
  INSPIRATION_COLUMN = 'INSPIRATION';

  PLAYER_ID_COLUMN = 'ID'
  TRB_DM_COLUMN = 'TRB_DM';
  TRB_PLAYER_COLUMN = 'TRB_PLAYER';
  TRB_SPECIAL_COLUMN = 'TRB_SPECIAL';
  TRB_SPENT_COLUMN = 'TRB_SPENT';
  TRB_LOST_COLUMN = 'TRB_LOST';
  TOKENS_COLUMN = 'TOKENS';
  SCP_COLUMN = 'SESSION_CLAIM_POINTS'

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
    let info = [RACE_COLUMN, SUBRACE_COLUMN, GENDER_COLUMN, CLASS_COLUMN, STATUS_COLUMN, BACKGROUND_COLUMN, NATIVE_COLUMN, REGION_COLUMN,
      VAULT_COLUMN, ALIGNMENT_COLUMN, BACKSTORY_COLUMN];

    return new Promise((resolve, reject) => {
      let charName = args[0];
      if (!charName) resolve('No character name was given.')
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          if (!globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM]) &&
              !sheetOp.authorizedCharacter(table, message, charName))
            resolve('Not authorized to get the data of this character.');

          let columnHdr = table[HEADER_ROW];
          let location = {};
          // location[ID_COLUMN] = message.author.id;
          location[CHAR_COLUMN] = charName;
          let row = sheetOp.getRowWithValue(table, CHAR_COLUMN, charName, true);
          if (row == -1) return resolve('Character does not exist!');

          let data = table[row];

          let mxp = data[columnHdr.indexOf(MXP_COLUMN)];
          let heroPoints = data[columnHdr.indexOf(HERO_POINTS_COLUMN)];
          let inspiration = data[columnHdr.indexOf(INSPIRATION_COLUMN)];
          let level = MXP_THRESHOLDS.indexOf(MXP_THRESHOLDS.find((th) => {return mxp < th;})) - 1;
          let embed = utils.constructEmbed(charName, "Level: " + level + ". MXP: " + mxp +
              ". MXP to next level: " + (MXP_THRESHOLDS[level + 1] - mxp) +
              ".\nHero Points: " + ((typeof heroPoints === 'undefined') ? 0 : heroPoints) + " Inspiration: " + ((typeof inspiration === 'undefined') ? 0 : inspiration) + ".");

          let fields = [];
          for (i = 0; i < info.length; i++) {
            fields.push({
              name: info[i],
              value: (typeof data[columnHdr.indexOf(info[i])] === 'undefined') ? 'Not Set' : data[columnHdr.indexOf(info[i])],
              inline: true,
            });
          };

          embed.addFields(fields);
          if (data[columnHdr.indexOf(IMAGE_COLUMN)] != 0) {
            embed.setImage(data[columnHdr.indexOf(IMAGE_COLUMN)]);
          };
          resolve({embed});
        }).catch((err) => {console.log('getCharacterInfo error: ' + err)});
    });
  };

  commands.getPlayerInfo = function(message, args) {
    let info = [TOKENS_COLUMN, SCP_COLUMN]
    let info_names = ['Tokens', 'Session Claim Points']

    let playerId = message.member.user.id;
    if (message.mentions.users.first()) playerId = message.mentions.users.first().id;
    return new Promise((resolve, reject) => {
      Promise.all([sheetOp.getSheet(PLAYERS_SHEET), sheetOp.getSheet(CHARACTERS_SHEET)])
        .then(([table, characterTable]) => {
          if (!globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM]) &&
              playerId != message.member.user.id)
            resolve('Not authorized to get the data of this player.');

          let columnHdr = table[HEADER_ROW];
          let row = sheetOp.getRowWithValue(table, PLAYER_ID_COLUMN, playerId, true);
          if (row == -1) return resolve('Player is not registered yet!');

          let data = table[row];

          let playerName;
          let playerRoles = [];
          if (playerId == message.member.user.id) {
            playerName = message.member.user.username;
            let roleCache = message.member.roles.cache.array();
            for (i = 0; i < roleCache.length; i++) {
              playerRoles.push(roleCache[i].name);
            }
          } else {
            let user = message.mentions.members.array()[0];
            playerName = user.user.username;
            let roleCache = user.roles.cache.array();
            for (i = 0; i < roleCache.length; i++) {
              playerRoles.push(roleCache[i].name);
            }
          }

          let patreon = 'None'
          if (playerRoles.includes(globe.roles.SOLDIER)) {
            patreon = 'Soldier';
          } else if (playerRoles.includes(globe.roles.KING)) {
            patreon = 'King';
          } else if (playerRoles.includes(globe.roles.DEMON)) {
            patreon = 'Demon';
          }

          // Construct description
          let serverStaff = false;
          let notable_roles = [globe.roles.DEMON_DADDY, globe.roles.GM, globe.roles.TRIAL_GM, globe.roles.GM_COACH, globe.roles.MODERATOR, globe.roles.RULES_TEAM,
            globe.roles.TECH_TEAM, globe.roles.KING, globe.roles.DEMON, globe.roles.SOLDIER]
          let desc = '';
          for (i = 0; i < notable_roles.length; i++) {
            if (playerRoles.includes(notable_roles[i])) {
              desc += notable_roles[i] + ', ';
              serverStaff = true;
            }
          }

          if (desc != '') {
            desc = desc.substring(0, desc.length - 2);
          }

          let embed = utils.constructEmbed(playerName, desc);

          let fields = [];

          // Figure out Lifetime and Available TRB
          let lifetimeTRB = parseInt(data[columnHdr.indexOf(TRB_DM_COLUMN)]) + parseInt(data[columnHdr.indexOf(TRB_PLAYER_COLUMN)]) + parseInt(data[columnHdr.indexOf(TRB_SPECIAL_COLUMN)])
          let unavailableTRB = parseInt(data[columnHdr.indexOf(TRB_SPENT_COLUMN)]) + parseInt(data[columnHdr.indexOf(TRB_LOST_COLUMN)])
          let availableTRB = lifetimeTRB - unavailableTRB

          if (isNaN(availableTRB)) {
            lifetimeTRB = 0;
            availableTRB = 0;
          }

          fields.push({
            name: 'Available TRB',
            value: availableTRB,
            inline: true,
          });

          fields.push({
            name: 'Lifetime TRB',
            value: lifetimeTRB,
            inline: true,
          });

          for (i = 0; i < info.length; i++) {
            fields.push({
              name: info_names[i],
              value: (typeof data[columnHdr.indexOf(info[i])] === 'undefined') ? 'Not Set' : data[columnHdr.indexOf(info[i])],
              inline: true,
            });
          };

          embed.addFields(fields);
          if (patreon == 'Soldier') {
            embed.setThumbnail('https://tinyurl.com/ybpq6peh');
          } else if (patreon == 'King') {
            embed.setThumbnail('https://tinyurl.com/4h7mg4yr');
          } else if (patreon == 'Demon') {
            embed.setThumbnail('https://tinyurl.com/19axxqt0');
          } else if (serverStaff) {
            embed.setThumbnail('https://tinyurl.com/33qhdupc');
          }
          resolve({embed});
        }).catch((err) => {console.log('getCharacterInfo error: ' + err)});
    });
  };

  commands.registerCharacter = function(message, args) {
    return new Promise((resolve, reject) => {
      let charName = args.slice(1).join(' ');

      if (charName == '') {
        return resolve('No character name specified.');
      } else if (/\s/.test(charName)) {
        return resolve('Please do not register character names with spaces. Try using "_" or "-" in between for the purposes of the bot.')
      }

      let playerId = message.member.user.id;
      let playerName = message.member.user.tag;
      Promise.all([sheetOp.getSheet(CHARACTERS_SHEET), sheetOp.getSheet(TIMELINE_SHEET)])
        .then(([charactersTable, timelineTable]) => {
          // Checks if character name exists or is a prefix of another.
          let charIdx = sheetOp.getRowWithValue(charactersTable, CHAR_COLUMN, charName, true)
          if (charIdx != -1) {
            throw new Error('Character name too identical to: ' + charactersTable[charIdx][charactersTable[HEADER_ROW].indexOf(CHAR_COLUMN)])
          }

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
          if (err.toString().startsWith('Error: Character name too')) {
            resolve(err.toString());
          } else {
            resolve('Bot error: registering character failed.');
          }
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

  commands.registerPlayer = function(message, args, players) {
    return new Promise((resolve, reject) => {
      let playerName = message && message.member.user.tag;
      sheetOp.getSheet(PLAYERS_SHEET)
        .then((table) => {
          let requests = [];
          let headerTags = table[HEADER_ROW];
          let idRowIdx = headerTags.indexOf(ID_COLUMN);
          let numNewPlayers = 0;

          let playerList = players || message.mentions.members.map(member => member.id);
          for (j = 0; j < playerList.length; j++) {
            let playerArr = [];
            let playerId = playerList[j];
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
      Promise.all([sheetOp.getSheet(CHARACTERS_SHEET), sheetOp.getSheet(TIMELINE_SHEET)])
        .then(([charTable, timelineTable]) => {
          let charNameRowIdx = charTable[HEADER_ROW].indexOf(CHAR_COLUMN);
          let requests = [];
          for (let i = 1; i < charTable.length; i++) {
            if (charTable[i][charNameRowIdx] === charName) {
              let req = utils.genDeleteRowRequest(CHARACTERS_SHEET_ID, i, i + 1);
              requests.push(req);
              break;
            };
          };
          charNameRowIdx = timelineTable[HEADER_ROW].indexOf(CHAR_COLUMN);
          for (let i = 1; i < timelineTable.length; i++) {
            if (timelineTable[i][charNameRowIdx] === charName) {
              let req = utils.genDeleteRowRequest(TIMELINE_SHEET_ID, i, i + 1);
              requests.push(req);
              break;
            };
          };

          // No rows found with matching discord id and character name
          if (requests.length === 0) {
            resolve('No character exists named: ' + charName);
          }
          else {
            sheetOp.sendRequests(requests, message).then(() => {
              resolve('Successfully deleted character.');
            }).catch(() => {
              resolve('Error deleting character.');
            });
            resolve('Deleted ' + charName + '.'); // TODO: retrieve player's ID and convert to tag for display here
          }
        }).catch((err) => {console.log('deleteCharacter error: ' + err)});
    });
  }

  commands.listCharacter = function(message, args) {
    return new Promise((resolve, reject) => {
      let playerId = message.mentions.members.first() || message.member.user.id;
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
            resolve(playerId.toString() + ' has no characters registered yet!');
          };

          resolve('Registered characters for ' + playerId.toString() + ': ' + charList.join(', '));
        }).catch((err) => {console.log('listCharacter error: ' + err)});
    });
  }

  commands.updateCharacter = function(message, args) {
    updatable = [RACE_COLUMN, SUBRACE_COLUMN, GENDER_COLUMN, CLASS_COLUMN, STATUS_COLUMN, NATIVE_COLUMN, REGION_COLUMN, VAULT_COLUMN, BACKGROUND_COLUMN, ALIGNMENT_COLUMN, BACKSTORY_COLUMN, IMAGE_COLUMN];
    return new Promise((resolve, reject) => {
      let location = {};
      location[ID_COLUMN] = message.author.id;
      if (!args[1]) resolve('Please specify which character you are updating!');
      location[CHAR_COLUMN] = args[1];

      let updates = {};
      if (!args[2] && args[1] != 'help') {
        return resolve('You need to specify what you want to update! You can choose from: Race, Subrace, Gender, Class, Status, Native, Region, Vault, Background, Alignment, Backstory, Image.\n' +
            'You can also do \`\\char update help\` for more information');
      }
      else if (args[1] != 'help' && updatable.includes(args[2].toUpperCase())) {
        updates[args[2].toUpperCase()] = args.slice(3).join(' ');
      }
      else if (args[1] != 'help' && args[2].includes('\n')) {
        location[CHAR_COLUMN] = location[CHAR_COLUMN].replace('\n', '');
        let updateArgs = args.slice(2).join(' ').split('\n');
        for (i = 0; i < updateArgs.length; i++) {
          let updateArg = updateArgs[i].split(':');
          if (updateArg[1] && updatable.includes(updateArg[0])) {
            updates[updateArg[0]] = updateArg.slice(1).join(':').trim();
          };
        };
      }
      else {
        return resolve("You can update the following individually by \`\\char update <CHARACTER NAME> <CATEGORY> <VALUE>\` or using the template: \n" +
          ">>> \\char update <CHARACTER NAME>\n" +
          " \\\`\\\`\\\`\n" +
          RACE_COLUMN + ":\n" +
          SUBRACE_COLUMN + ":\n" +
          GENDER_COLUMN + ":\n" +
          CLASS_COLUMN + ":\n" +
          STATUS_COLUMN + ":\n" +
          NATIVE_COLUMN + ":\n" +
          REGION_COLUMN + ":\n" +
          VAULT_COLUMN + ":\n" +
          BACKGROUND_COLUMN + ":\n" +
          ALIGNMENT_COLUMN + ":\n" +
          BACKSTORY_COLUMN + ": (**Remember Discord has a 2000 character limit!**)\n" +
          IMAGE_COLUMN + ":\n" +
          "\\\`\\\`\\\`"
        );
      }

      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          let requests = [];
          requests = sheetOp.updateRowOnSheet(table, requests, CHARACTERS_SHEET_ID, location, updates, message);

          if (requests == null) {
            return resolve('Need to specify valid character name you own for update.');
          }

          sheetOp.sendRequests(requests, message).then(() => {
            resolve('Character Updated!');
          }).catch(() => {
            resolve('Error when updating character values.');
          });
        }).catch((err) => {
          console.error('updateCharacter error: ' + err);
          resolve('Error accessing gSheets.');
        });
    });
  }

  /**
  * TODO: This needs to be refactored into addCharacterValue and addPlayerValue.
  * Add a numerical amount of a value to character(s)
  * args format: (valueName, amount, character prefixes...)
  */
  commands.addCharacterValue = function(message, args) {
    return new Promise((resolve, reject) => {
      let valueName = args[0].toUpperCase();
      let amount = 0;
      let characters = [];
      amount = parseInt(args[1]);
      characters = args.slice(2);
      if (!(valueName && amount)) resolve('No resource name and/or amount was given.');
      else if (!characters.length) resolve('No character names or prefixes were given.');
      let sheetName = CHARACTERS_SHEET;
      let sheetId = CHARACTERS_SHEET_ID;
      let columnId = CHAR_COLUMN;
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

  commands.addPlayerValue = function(message, players, valueName, amount) {
    return new Promise((resolve, reject) => {
      sheetOp.getSheet(PLAYERS_SHEET)
        .then((table) => {
          const valueCol = table[HEADER_ROW].indexOf(valueName);
          let requests = [];
          for (player of players) {
            let playerRow = sheetOp.getRowWithValue(table, ID_COLUMN, player, true);
            let curValue = table[playerRow][valueCol] ? parseInt(table[playerRow][valueCol]) : 0;
            let newValue = curValue + amount;
            let req = utils.genUpdateCellsRequest([newValue], PLAYERS_SHEET_ID, playerRow, valueCol);
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

  commands.addTRB = function(message, args) {
    return new Promise((resolve, reject) => {
      let valueName = args[0].toUpperCase();
      let amount = 0;
      let players = [];

      if (!args[1]) resolve('TRB type not provided.');
      amount = parseInt(args[2]);
      if (valueName.toUpperCase() === 'SPENT') {
        amount = -amount;
      }
      valueName = valueName + "_" + args[1].toUpperCase();
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

  commands.scpMonthly = async function(guild) {
    const valueName = 'SESSION_CLAIM_POINTS';
    const values = {};
    values[globe.roles.ACTIVE] = 3;
    values[globe.roles.GM] = 1;
    values[globe.roles.KING] = 1;
    values[globe.roles.DEMON] = 1;
    values[globe.roles.GM_COACH] = 1;
    const amountsToAdd = {};
    await guild.members.fetch().then(members => {
      members.forEach(member => {
        guild.roles.cache.forEach((role) => {
          const amount = values[role.name];
          if (!!amount && member.roles.cache.find(r => r.name == role.name)) {
            amountsToAdd[member.id] = amountsToAdd[member.id] || 0;
            amountsToAdd[member.id] += amount;
          }
        });
      })
    });

    const players = Object.keys(amountsToAdd);
    await commands.registerPlayer(null, null, players);

    return sheetOp.getSheet(PLAYERS_SHEET)
      .then((table) => {
        const valueCol = table[HEADER_ROW].indexOf(valueName);
        let requests = [];
        for (player of players) {
          const playerRow = sheetOp.getRowWithValue(table, ID_COLUMN, player, true);
          const curValue = table[playerRow][valueCol] ? parseInt(table[playerRow][valueCol]) : 0;
          let newValue = curValue + amountsToAdd[player];
          const scpMax = amountsToAdd[player]*2;
          if (newValue > scpMax) newValue = scpMax;
          let req = utils.genUpdateCellsRequest([newValue], PLAYERS_SHEET_ID, playerRow, valueCol);
          requests.push(req);
        };
        return sheetOp.sendRequests(requests, null, true).then(() => {
          return 'Successfully added monthly Session Claim Points.';
        }).catch((err) => {
          return 'Error modifying values.';
        });
      });
  }

  return commands;
}
