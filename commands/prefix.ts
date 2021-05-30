import Discord from 'discord.js';
import { findServer } from '../helpers/server';
import { Command } from '../typedefs';

const validPrefixes = '.,!?/<>;~';

const prefixCommand: Command = {
  name: 'prefix',
  description: 'List the prefix for this server, or change the prefix for this server if one is specified.',
  adminOnly: true,
  usage: '<new prefix (optional)>',
  execute: async (message, args) => {
    const serverId = message.guild!.id;

    // return current prefix
    if (args.length === 0) {
      const server = await findServer(serverId);
      if (!server) return;

      const hasAdmin = message.member!.hasPermission('ADMINISTRATOR');

      const embed = new Discord.MessageEmbed({
        title: "Server prefix",
        description: "The current server prefix is `" + server.prefix + "`." + 
          (hasAdmin ? 
            " Available prefixes include: `" + validPrefixes + "`."
          :
            ""
          ),
      });

      message.channel.send(embed);

      return;
    }

    // check whether prefix is valid
    else if (!validPrefixes.includes(args[0]) || args[0].length > 1) {
      const embed = new Discord.MessageEmbed({
        title: "Error setting new prefix",
        description: "Invalid prefix provided. Available prefixes include: `" + validPrefixes + "`.",
        color: "#ff0000"
      });

      message.channel.send(embed);

      return;
    };

    // guarenteed to return document
    findServer(serverId).then((server) => {
      if (!server) return;

      server.prefix = args[0]  // set new prefix
      server.save();

      const embed = new Discord.MessageEmbed({
        title: "Prefix set!",
        description: "The prefix for this server is now `" + server.prefix + "`.",
        color: "#08FF00"
      });

      message.channel.send(embed);
    }).catch(err => {
      console.error(err);
    })
  }
}

export default prefixCommand;