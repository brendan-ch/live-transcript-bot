import Discord from 'discord.js';
import { Command, ConnectionCommand } from "../typedefs";

const joinCommand: ConnectionCommand = {
  name: "join",
  description: "Join the VC the user is currently in.",
  usage: "!join",
  execute: async function(message: Discord.Message, args: Array<string>) {
    const user = message.member;
    const vc = user?.voice.channel;

    let connection: Discord.VoiceConnection | null = null;

    if (vc && !vc.members.array().map(member => member.id).includes(message.client.user!.id)) {
      connection = await vc.join();
    };

    return {
      connection: connection,
      channel: message.channel
    };
  }
};

export default joinCommand;