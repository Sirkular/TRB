module.exports = function() {
  const commands = {};
  const sheetOp = require('./sheetOperations.js')();
  const utils = require('./utils.js')();

  HEADER_ROW = 0;
  ID_COLUMN = 'ID';
  CHAR_COLUMN = 'CHAR_NAME';
  MXP_COLUMN = 'MXP'

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
