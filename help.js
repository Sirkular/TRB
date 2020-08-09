module.exports = function() {
  const help = {};
  const commands = {
    "add":  "\`add resource amount char_prefix1 char_prefix2 ...\`",
    "info": "\`info char_prefix1\`",
    "char": "\`char register character_name \/ char delete character_name \/ char list\`",
    "timeline": {
      "advance": "\`timeline advance char_prefix1 char_prefix2 ... days [startingDay] activity\`",
      "query": "\`timeline query char_prefix day\`"
    },
    "downtime": {
      "spend": "\`downtime spend char_prefix days activity\`",
      "query": "\`downtime query char_prefix (day)\`"
    }
  };
  const descriptions = {
    "info": "Get the MXP of character.",
    "add": "Add amount of resource to characters." +
           "character_prefix is any prefix of a character\'s name, spaces not allowed." +
           "e.g. Irontank has Iron, Iront, Irontank as valid prefixes.",
    "char": "General character command. Allows register, delete, and list.",
    "timeline": {
      "advance": "Finds the character farthest in the future out of all characters " +
                  "provided and syncs the other characters' timeline to the farthest by " +
                  "filling in the disparity with downtime.\n" +
                  "*startingDay* is an optional number that will be the baseline " +
                  "with which to sync all characters using downtime.",
      "query": "Outputs what activity the character is partaking in on *day*.",
    },
    "downtime": {
      "spend": "Spends \`days\` of a character\'s downtime days doing " +
      "\`activity\`. Is retroactively applied.",
      "query": "Outputs how many downtime days a character has. If *day* " +
      "is specified, outputs how many downtime days a character has up to that day, excluding the day itself.",
    }

  };

  help.getHelp = function(args) {
    let command = args[0];
    let subCommand = args[1];
    let out = "";
    if (!command) {
      return displayAll();
    }
    else if (!(command in commands)) {
      out = "Command does not exist.";
    }
    else if (!subCommand) {
      if (typeof commands[command] === 'object') {
        Object.entries(commands[command]).forEach(([key, value]) => {
          out += value + "\n" + descriptions[command][key] + "\n";
        });
      }
      else {
        out = commands[command] + "\n" + descriptions[command];
      }
    }
    else if (typeof commands[command] === 'string' || !(subCommand in commands[command])) {
      out = "Subcommand does not exist."
    }
    else {
      out = commands[command][subCommand] + descriptions[command][subCommand];
    }
    return out;
  }

  function displayAll() {
    let out = "";
    Object.entries(commands).forEach(([command, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subCommand, val]) => {
          out += commands[command][subCommand] + "\n" + descriptions[command][subCommand] + "\n";
        });
      }
      else {
        out += commands[command] + "\n" + descriptions[command] + "\n";
      }
    });
    return out;
  }

  return help;
}
