module.exports = function() {
  const help = {};

  const utils = require('./utils.js')();

  const commands = ["info", "char", "downtime", "add", "timeline"];
  const help_commands = {
    "General": {
      "info": {
        "main": "Displays information for player or character.\n\`info <OPTIONAL CHARACTER NAME>\`",
        "sub": {
          "general": "Gives general player information.\n\`info\`",
          "character": "Gives general character information\n\`info <CHARACTER NAME>\`"
        },
      },
      "char": {
        "main": "General command for character functions (registeration, delete, look up).\n\`char <register/list>\`",
        "sub": {
          "register": "Registers character into tracker.\n\`char register <FULL CHARACTER NAME>\`",
          "delete": "Deletes registered character from tracker permanently.\n\`char delete <CHARACTER NAME> \`\n**Note:** Character name with no spaces. Just first prefix OK.'",
          "list": "List registered characters in tracker for player.\n\`char list <OPTIONAL_MENTION>\`",
        },
      },
    },
    "DM Specific": {
      "add": {
        "main": "Adds a specific amount for a resource for a list of character/player.\n\`add <resource> <amount> <LIST OF RECEIVERS>\`",
        "sub": {
          "mxp": "Adds MXP for specified characters.\n\`add mxp <amount> <CHARACTER NAME 1> <CHARACTER NAME 2> ... \`\n**Note:** Character name with no spaces. Just first prefix OK.",
          "trb": "Adds specified TRB for specific players.\n\`add trb <dm/player/special> <amount> <PLAYER TAG 1> <PLAYER TAG 2> ... \`\n**Note:** Must tag player not just their names."
        },
      },
      "spend": {
        "main": "Spends a resource for a player.",
        "sub": {
          "trb": "Spends trb for a player.\n\`spend trb <amount> <PLAYER TAG>\`"
        }
      },
      "timeline": {
        "main": "Command for adjusting character timelines.\n\`timeline <advance/setperiod/check>\`",
        "sub": {
          "advance": "Finds the character farthest in the future out of all characters provided " +
                     "and syncs the other characters' timeline to the farthest by filling in the disparity with downtime, " +
                     "then advances their timeline by <DAYS> days with <ACTIVITY>.\n" +
                     "\`timeline advance <CHARACTER NAME 1> <CHARACTER NAME 2> ... <DAYS> <ACTIVITY>\`",
          "setperiod": "Syncs all characters' timeline to <STARTING DAY> by filling in the disparity with downtime, then advances their timeline by <DAYS> days with <ACTIVITY>.\n" +
                       "\`timeline setperiod <CHARACTER NAME 1> <CHARACTER NAME 2> ... <STARTING DAY> <DAYS> <ACTIVITY>\`",
          "check": "Outputs what activity the character is partaking in on <DAY>.\n\`timeline check <CHARACTER NAME> <DAY>\`",
        },
      },
      "downtime": {
        "main": "Allows players to use and look at their downtime.\n\`downtime <spend/check>\`",
        "sub": {
          "spend": "Spends <DAYS> of a character\'s downtime days doing <ACTIVITY>. Is retroactively applied.\n" +
                   "\`downtime spend <CHARACTER NAME> <DAYS> <ACTIVITY>\`",
          "check": "Outputs how many downtime days a character has. If <DAY> is specified, outputs how many downtime days a character has up to that day, excluding the day itself.\n" +
                   "\`downtime check <CHARACTER NAME> <DAY>\`",
        },
      },
    },
  };

  help.getHelp = function(args) {
    let command_arg = args[0];

    if (!command_arg) {
      return displayAll();
    }
    else if (!(commands.includes(command_arg))) {
      out = "Command does not exist.";
    }
    else {
      for (var category in help_commands) {
        if (command_arg in help_commands[category]) {
          for (command in help_commands[category]) {
            if (command == command_arg) {
              let embed = utils.constructEmbed(command_arg.charAt(0).toUpperCase() + command_arg.slice(1) + " Help", help_commands[category][command]["main"]);

              let fields = [];
              let desc = "";
              for (var sub_command in help_commands[category][command]["sub"]) {
                fields.push({
                  name: sub_command.toUpperCase(),
                  value: help_commands[category][command]["sub"][sub_command]
                });
              };

              embed.addFields(fields);

              return {embed};
            };
          };
        };
      };
    };
  }

  function displayAll() {
    let embed = utils.constructEmbed("The Realm Beyond Help", "Thank you for using the TRB Bot! If you need help, please ping a DM or Moderator!");

    let fields = [];
    for (var category in help_commands) {
      for (var command in help_commands[category]) {
        let desc = ""
        for (var sub_command in help_commands[category][command]["sub"]) {
          desc += "**" + sub_command + ": **" + help_commands[category][command]["sub"][sub_command] + "\n\n";
        };

        fields.push({
          name: command.toUpperCase(),
          value: desc
        });
      };

    };

    embed.addFields(fields);

    return {embed};
  }


  return help;
}
