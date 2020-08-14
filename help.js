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
          "list": "List registered characters in tracker for player.\n\`char list\`",
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
      "timeline": {
        "main": "Command for adjusting character timelines.\n\`timeline <advance/query>\`",
        "sub": {
          "advance": "Finds the character farthest in the future out of all characters " +
                  "provided and syncs the other characters' timeline to the farthest by " +
                  "filling in the disparity with downtime.\n" +
                  "*startingDay* is an optional number that will be the baseline " +
                  "with which to sync all characters using downtime.",
          "query": "Outputs what activity the character is partaking in on \`day\`.",
        },
      },
      "downtime": {
        "main": "Allows players to use and look at their downtime.\n\`downtime <spend/query>\`",
        "sub": {
          "spend": "Spends \`days\` of a character\'s downtime days doing \`activity\`. Is retroactively applied.",
          "query": "Outputs how many downtime days a character has.",
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
      let desc = ""
      for (var command in help_commands[category]) {
        desc += "**__" + command + ":__**\n";
        for (var sub_command in help_commands[category][command]["sub"]) {
          desc += "**" + sub_command + ":**" + help_commands[category][command]["sub"][sub_command] + "\n\n";
        };
      };

      fields.push({
        name: category,
        value: desc
      });
    };

    embed.addFields(fields);

    return {embed};
  }


  return help;
}
