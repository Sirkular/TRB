module.exports = function() {
  const help = {};
  const commands = {
    "add":  "\`add resource amount character_prefix1 character_prefix2 ...\`\n",
    "info": "\`info character_prefix1\`\n"
  };

  help.getHelp = function(args) {
    let command = args[0];
    if (!command) {
      return getCommands();
    }
    else if (command === "info") {
      let out = "";
      out += commands[command];
      out += "Get the MXP of character.\n";
      return out;
    }
    else if (command === "add") {
      let out = "";
      out += commands[command];
      out += "Add amount of resource to characters.\n";
      out += "character_prefix is any prefix of a character\'s name, spaces not allowed. e.g. Irontank has Iron, Iront, Irontank as valid prefixes.";
      return out;
    }
  }

  // TODO: Base commands returned on user role.
  function getCommands() {
    let output = "Supported commands:\n";
    return Object.values(commands).reduce((out, value) => {
      return out + " - " + value;
    }, output);
  }

  return help;
}
