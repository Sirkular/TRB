DEV_MODE = true;
SPREADSHEET_ID = '1cbxNvmAEqEGeHtaf09ZaWV3YF9Rmz2F6vayabfYWyf4';
CHARACTERS_SHEET_ID = '0';
PLAYERS_SHEET_ID = '1510652814';
TIMELINE_SHEET_ID = '415116931';
CHARACTERS_SHEET = 'Characters';
PLAYERS_SHEET = 'Players';
TIMELINE_SHEET = 'Timeline';

if (!DEV_MODE) require('dotenv').config();

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
  if(command === "ping") {
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  else if (command === 'help') {
    sendChunkedText(message, help.getHelp(args), true)
  }
  else if (command === 'info') {
    if (args.length == 0) {
      commands.getPlayerInfo(message, args).then((output) => {
        message.channel.send(output);
      });
    }
    else {
      commands.getCharacterInfo(message, args).then((output) => {
        message.channel.send(output);
      });
    }
  }
  else if (command === 'char') {
    if (args[0] === 'register') {
      commands.registerCharacter(message, args).then((output) => {
        message.channel.send(output);
      });
    }
    else if (args[0] === 'delete') {
      commands.deleteCharacter(message, args).then((output) => {
        message.channel.send(output);
      });
    }
    else if (args[0] === 'list') {
      commands.listCharacter(message, args).then((output) => {
        message.channel.send(output);
      });
    }
  }
  else if (command === 'add') {
    if (args[0] == 'trb') {
      commands.registerPlayer(message, args).then((output) => {
        commands.addValue(args).then((output) => {
          message.channel.send(output);
        });
      });
    }
    else {
      commands.addValue(args).then((output) => {
        message.channel.send(output);
      });
    }
  }
  else {
    message.channel.send('Command not recognized.');
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
