module.exports = function() {
  const commands = {};
  const sheetOp = require('./sheetOperations.js')();

  commands.getCharacterInfo = function(args) {
    return new Promise((resolve, reject) => {
      let charName = args[0];
      if (!charName) resolve('No character name was given.')
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then((table) => {
          let mxp = sheetOp.getCharacterValue(table, charName, "MXP");
          if (mxp === null) resolve('No character by that name exists.');
          resolve("MXP: " + mxp);
        }).catch((err) => {console.log('getCharacterInfo error')});
    });
  };

  return commands;
}
