import dotenv from 'dotenv';
dotenv.config();

import Discord from 'discord.js';
import fs from 'fs';
import { ClientWithCommands, Command } from './typedefs';
import { handleConnection } from './helpers/stream';
const client: ClientWithCommands = new Discord.Client();

client.commands = new Discord.Collection();

async function getCommands() {
  const commands: Array<Command> = [];

  // get filenames
  const commandFiles = fs.readdirSync('./dist/commands').filter(fileName => fileName.endsWith('.js'));

  // add commands to collection
  for (const fileName of commandFiles) {
    const command = await import(`./commands/${fileName}`);  // import command from each file
    commands.push(command.default);
  };

  return commands;
};

client.on('voiceStateUpdate', function(oldState, newState) {
  // check if it's bot who joins VC
  if (newState.connection && newState.member?.id === client.user!.id) {
    handleConnection(newState.connection);
  };
})

client.on('ready', function() {
  // run check for client user
  if (!client.user) {
    console.error("No bot user found, double-check your access token.")
    process.exit(1);
  };
  
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', async function(message) {
  // run check for client user
  if (!client.user) {
    console.error("No bot user found, double-check your access token.")
    process.exit(1);
  };

  const prefix = process.env.DEFAULT_PREFIX;
  if (!prefix) {
    console.error("No prefix specified.");
    process.exit(1);
  };

  // check message against prefix and author
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // trim extra whitespace and remove prefix
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()  // gets the first thing in args
  if (!client.commands || !commandName) return;

  const command = client.commands.get(commandName.toLowerCase());

  // retrieve the command and run execute method on it
  if (command) {
    command.execute(message, args);
  };
})

// call function to load commands
getCommands().then(commands => commands.forEach(command => client.commands?.set(command.name, command)));

// connect to API
const token = process.env.ACCESS_TOKEN;
client.login(token);