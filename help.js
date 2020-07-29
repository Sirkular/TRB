module.exports = function() {
  const help = {};

  help.getHelp = function(args) {
    if (args.length === 0) {
      return getCommands();
    }
    else {
      let out = "";
      // Add output to out.
      return out;
    }
  }

  // TODO: Base commands returned on user role.
  function getCommands() {
    return "The TRB Bot has no commands currently.";
  }

  return help;
}
