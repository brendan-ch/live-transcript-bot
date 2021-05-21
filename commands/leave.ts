import Discord from 'discord.js';
import { ConnectionCommand, ConnectionWrapper } from "../typedefs";

const leaveCommand: ConnectionCommand = {
  name: "leave",
  description: "Leave the VC the user is currently in.",
  usage: "!leave",
  execute: async function(message: Discord.Message, args: Array<string>) {
    const user = message.member;
    const vc = user?.voice.channel;

    if (vc) {
      await vc.leave();
    };

    return {
      connection: null,
      channel: message.channel
    };
  }
};

export default leaveCommand;