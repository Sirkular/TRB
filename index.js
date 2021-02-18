// Load consts
globe = {};
globe.roles = {
  GM: 'GM',
  TRIAL_GM: 'Trial GM',
  SOLDIER: 'Soldier',
  KING: 'King',
  DEMON: 'Demon',
  DEMON_DADDY: 'Demon Daddy',
  GM_COACH: 'GM Coach',
  MODERATOR: 'Moderator',
  RULES_TEAM: 'Rules Team',
  TECH_TEAM: 'Tech Team',
  ACTIVE: 'Active'
};
require('dotenv').config();
require('./branchConstants.js');

/**
* @param message - A Discord.js message object.
* @param authorizedRoles - An array of enums from roles.
*/
globe.authorized = function(message, authorizedRoles) {
  const authorRoles = message.member.roles.cache;
  return !!authorRoles.find(role => authorizedRoles.includes(role.name));
};

///////////////////////////////Discord Setup///////////////////////////////////

const Discord = require('discord.js');
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values.
const config = require('./config.json');
// config.token contains the bot's token, config.prefix contains the message prefix.

////////////////////////////////Load Modules///////////////////////////////////

require('./timestampConsole.js')();
const help = require('./help.js')();
const commands = require('./commands.js')();

///////////////////////////////////////////////////////////////////////////////

client.on('error', console.error);

client.on('ready', () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the 'ClientUser'.
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('guildCreate', guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('guildDelete', guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

// This event will run on every single message received, from any channel or DM.
client.on('message', async message => {
  // Ignore other bots.
  if(message.author.bot) return;

  // Ignore any message without our prefix.
  if(message.content.indexOf(config.prefix) !== 0) return;

  // Here we separate our 'command' name, and our 'arguments' for the command.
  // e.g. if we have the message '+say Is this the real life?' , we'll get the following:
  // command = say
  // args = ['Is', 'this', 'the', 'real', 'life?']
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (message.guild == null && command != 'help') {
    message.channel.send('Please use server channels to use commands other than help.');
    return;
  }

  /////////////////////////////////Commands////////////////////////////////////
  function sendToChannel(output) {
    message.channel.send(output);
  }

  if(command === "ping") {
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  else if (command === 'help') {
    message.channel.send(help.getHelp(args));
  }
  else if (command === 'info') {
    if (args.length == 0) {
      commands.getPlayerInfo(message, args).then(sendToChannel);
    }
    else if (message.mentions.users.first()) {
      if (globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM])) {
        commands.getPlayerInfo(message, args).then(sendToChannel);
      }
      else {
        sendToChannel('Not authorized.');
      }
    }
    else {
      commands.getCharacterInfo(message, args).then(sendToChannel);
    }
  }
  else if (command === 'char') {
    if (args[0] === 'register') {
      commands.registerCharacter(message, args).then(sendToChannel);
    }
    else if (args[0] === 'delete') {
      if (globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM])) {
        commands.deleteCharacter(message, args).then(sendToChannel);
      }
      else {
        sendToChannel('Not authorized.');
      }
    }
    else if (args[0] === 'list') {
      if (message.mentions.members.first() &&
          !globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM])) {
        sendToChannel('Not authorized to get the data of others.');
      }
      else commands.listCharacter(message, args).then(sendToChannel);
    }
    else if (args[0] === 'update') {
      commands.updateCharacter(message, args).then(sendToChannel);
    }
  }
  else if (command === 'add') {
    const playerValues = ['token', 'scp'];
    const playerValuesHeader = ['tokens', 'session_claim_points'];
    const characterValues = ['mxp', 'hp', 'insp'];
    const characterValuesHeader = ['mxp', 'hero_points', 'inspiration'];
    if (globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM])) {
      if (!args[0]) {
        sendToChannel('No resource entered.');
      }
      else if (args[0] === 'trb') {
        commands.registerPlayer(message, args).then((output) => {
          commands.addTRB(message, args).then(sendToChannel);
        });
      }
      else if (playerValues.includes(args[0])) {
        commands.registerPlayer(message, args).then((output) => {
          const valueName = playerValuesHeader[playerValues.indexOf(args[0])].toUpperCase();
          const amount = parseInt(args[1]);
          const players = message.mentions.members.map(member => member.id);
          if (isNaN(amount)) return sendToChannel('No amount was provided.');
          if (!players.length) return sendToChannel('No players were mentioned.');
          commands.addPlayerValue(message, players, valueName, amount).then(sendToChannel);
        });
      }
      else if (characterValues.includes(args[0])) {
        args[0] = characterValuesHeader[characterValues.indexOf(args[0])].toUpperCase();
        commands.addCharacterValue(message, args).then(sendToChannel);
      }
      else {
        sendToChannel('Invalid resource.');
      }
    }
    else
      sendToChannel('Not authorized.');
  }
  else if (command === 'spend') {
    if (globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM])) {
      if (!args[0]) {
        sendToChannel('No resource entered.');
      }
      else if (args[0] === 'trb') {
        commands.registerPlayer(message, args).then((output) => {
          args.splice(1, 0, 'spent');
          commands.addTRB(message, args).then(sendToChannel);
        });
      }
      else {
        sendToChannel('Invalid player resource provided.');
      }
    }
    else
      sendToChannel('Not authorized.');
  }
  else if (command === 'timeline') {
    if (args[0] === 'advance') {
      if (globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM]))
        commands.advanceTimeline(message, args.slice(1)).then(sendToChannel);
      else
        sendToChannel('Not authorized.');
    }
    else if (args[0] === 'setperiod') {
      if (globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM]))
        commands.advanceTimeline(message, args.slice(1), true).then(sendToChannel);
      else
        sendToChannel('Not authorized.');
    }
    else if (args[0] === 'check') {
      commands.queryTimeline(args.slice(1)).then(sendToChannel);
    }
    else {
      sendToChannel('Please enter one of the following: \`advance\`, \`setperiod\`, or \`check\`');
    }
  }
  else if (command === 'downtime') {
    if (args[0] === 'spend') {
      if (globe.authorized(message, [globe.roles.GM, globe.roles.TRIAL_GM]))
        commands.spendDowntime(message, args.slice(1)).then(sendToChannel);
      else
        sendToChannel('Not authorized.');
    }
    else if (args[0] === 'check') {
      commands.queryDowntime(message, ...args.slice(1)).then(sendToChannel);
    }
    else {
      sendToChannel('Please provide one of the following: \`spend\` or \`check\`');
    }
  }
  else if (command === 'scpmonthly') {
    if (message.member.user.id == '283958672294674435') commands.scpMonthly(message).then(sendToChannel); // Saint
    else sendToChannel('Not authorized.');
  }
  else {
    sendToChannel('Command not recognized.');
  }
});

function sendChunkedText(message, text, channel) {
  const CHUNK_SIZE = 1900;
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    if (channel) message.channel.send(text.substring(i, i + CHUNK_SIZE));
    else message.author.send(text.substring(i, i + CHUNK_SIZE));
  }
}

client.login((!DEV_MODE) ? process.env.TOKEN : config.token);
