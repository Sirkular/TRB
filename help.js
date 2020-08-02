module.exports = function() {
  const help = {};
  const commands = {
    "add":  "\`add resource amount character_prefix1 character_prefix2 ...\`\n",
    "info": "\`info character_prefix1\`\n",
    "char": "\`char register character_name \/ char delete character_name \/ char list\`\n"
  };

  help.getHelp = function(args) {
    let command = args[0];
    if (!command) {
      return getCommands();
    }
    else {
      let out = commands[command];
      if (command === "info") {
        out += "Get the MXP of character.\n";
      }
      else if (command === "add") {
        out += "Add amount of resource to characters.\n";
        out += "character_prefix is any prefix of a character\'s name, spaces not allowed. e.g. Irontank has Iron, Iront, Irontank as valid prefixes.";
      }
      else if (command === "char") {
        out += "General character command. Allows register, delete, and list.\n"
      }
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
