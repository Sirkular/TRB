module.exports = function() {
  const help = {};
  const commands = {
    "add":  "\`add resource amount char_prefix1 char_prefix2 ...\`\n",
    "info": "\`info char_prefix1\`\n",
    "char": "\`char register character_name \/ char delete character_name \/ char list\`\n",
    "timeline": {
      "advance": "\`timeline advance char_prefix1 char_prefix2 ... days (startingDay) activity\`\n",
      "query": "\`timeline query char_prefix day\`\n"
    },
    "downtime": {
      "spend": "\`downtime spend char_prefix days activity\`\n",
      "query": "\`downtime query char_prefix\`\n"
    }
  };

  help.getHelp = function(args) {
    let command = args[0];
    let subCommand = args[1];
    if (!command) {
      return getCommands();
    }
    else {
      let out;
      if (subCommand) out = commands[command][subCommand];
      else out = commands[command];
      out = (!out || typeof out === 'object') ? '' : out;
      if (command === "info") {
        out += "Get the MXP of character.\n";
      }
      else if (command === "add") {
        out += "Add amount of resource to characters.\n";
        out += "character_prefix is any prefix of a character\'s name, spaces not allowed." +
               "e.g. Irontank has Iron, Iront, Irontank as valid prefixes.";
      }
      else if (command === "char") {
        out += "General character command. Allows register, delete, and list.\n";
      }
      else if (command === "timeline") {
        if (subCommand === "advance") {
          out += "Finds the character farthest in the future out of all characters " +
          "provided and syncs the other characters' timeline to the farthest by " +
          "filling in the disparity with downtime.\n";
          out += "\`startingDay\` is an optional number that will be the baseline " +
          "with which to sync all characters using downtime.\n";
        }
        else if (subCommand === "query") {
          out += "Outputs what activity the character is partaking in on \`day\`.\n";
        }
        else if (!subCommand) {
          out += "Timeline interaction root commmand.\n";
          out += "Specific commands are: \`timeline advance\` and \`timeline query\`\n";
        }
        else {
          out += "Subcommand for timeline doesn't exist.\n";
          out += "Specific commands are: \`timeline advance\` and \`timeline query\`\n";
        }
      }
      else if (command === "downtime") {
        if (subCommand === "spend") {
          out += "Spends \`days\` of a character\'s downtime days doing " +
          "\`activity\`. Is retroactively applied.\n";
        }
        else if (subCommand === "query") {
          out += "Outputs how many downtime days a character has.\n";
        }
        else if (!subCommand) {
          out += "Downtime interaction root commmand.\n";
          out += "Specific commands are: \`downtime spend\` and \`downtime query\`\n";
        }
        else {
          out += "Subcommand for spend doesn't exist.\n";
          out += "Specific commands are: \`downtime spend\` and \`downtime query\`\n";
        }
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
