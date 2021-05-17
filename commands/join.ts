import Discord from 'discord.js';
import { Command, ConnectionCommand } from "../typedefs";

const joinCommand: ConnectionCommand = {
  name: "join",
  description: "Join the VC the user is currently in.",
  usage: "!join",
  execute: async function(message: Discord.Message, args: Array<string>) {
    const user = message.member;
    const vc = user?.voice.channel;

    if (vc) {
      const connection = await vc.join();
    };
  }
};

export default joinCommand;