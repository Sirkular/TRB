module.exports = function() {
  const commands = {};
  const sheetOp = require('./sheetOperations.js')();

  commands.getCharacterInfo = function(args) {
    return new Promise((resolve, reject) => {
      let charName = args[0];
      if (!charName) resolve('No character name was given.')
      sheetOp.getSheet(CHARACTERS_SHEET)
        .then(function(sheetObj) {
          resolve(sheetOp.getCharacterValue(sheetObj, charName, "MXP"));
        }).catch((err) => {});
    });
  };

  return commands;
}
