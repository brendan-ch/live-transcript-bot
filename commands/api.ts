import Discord from 'discord.js';
import bcrypt from 'bcrypt';
import { findServer } from '../helpers/server';
import { Command } from '../typedefs';
import randomString from '../helpers/randomString';

const apiCommand: Command = {
  name: "api",
  description: "Configure the API.",
  adminOnly: true,
  execute: async function(message: Discord.Message, args: Array<string>) {
    const serverId = message.guild!.id;
    const arg = args.length > 0 ? args[0] : undefined;

    const server = await findServer(serverId);

    const embed = new Discord.MessageEmbed();

    switch (arg) {
      case "enable":
        // Enable the api

        server.enableApi = true;
        await server.save();

        embed.title = "API enabled";
        embed.description = "To start using the API, generate a new key using `api generate`.";

        message.channel.send(embed);

        break;

      case "disable":
        // Enable the api

        server.enableApi = false;
        server.keys = [];
        await server.save();

        embed.title = "API disabled and keys wiped";
        embed.description = "To enable the API again, run `api enable`.";

        message.channel.send(embed);

        break;
      
      case "generate":
        // Generate a key and hash it using bcrypt
        const key = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

        const hash = await bcrypt.hash(key, 10);
        server.keys.push(hash);
        server.save();
        
        embed.title = "Key generated";
        embed.description = `Here is your API key: ||${key}||\n\nMake sure to save it in a secure place; it cannot be retrieved after it is generated.`

        message.channel.send(embed);

        break;

      case "reset":
        // Reset all API keys
        server.keys = [];
        server.save();

        embed.title = "Keys wiped";
        embed.description = "To generate a new key, run `api generate`."

        message.channel.send(embed);

        break;

      default:
        // Print out state of API for the server

        // const embed = new Discord.MessageEmbed({
        //   title: "API",
        //   description: `Current API state: ${server.enableApi ? "enabled" : "disabled"}\n\nNumber of keys: ${server.keys.length}`
        // });
        embed.title = "API information";
        embed.description = `Current API state: ${server.enableApi ? "enabled" : "disabled"}\n\nNumber of keys: ${server.keys.length}`;

        message.channel.send(embed);

        // message.channel.send(embed);
    }
  }
}

export default apiCommand;