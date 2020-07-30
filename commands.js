module.exports = function() {
  const commands = {};
  let googleAuth;
  require('./googleAuth.js')().then((oAuth2Client) => {
    googleAuth = oAuth2Client;
  });
  const sheetOp = require('./sheetOperations.js')(googleAuth.google);

  commands.getCharacterInfo = function(args) {
    return new Promise((resolve, reject) => {
      let charName = args[0];
      if (!charName) resolve('No character name was given.')
      sheetOp.getSheet(googleAuth.auth, CHARACTERS_SHEET)
        .then(function(sheetObj) {
          resolve(sheetOp.getCharacterValue(sheetObj, charName, "MXP"));
        }).catch((err) => {});
    });
  };

  return commands;
}
