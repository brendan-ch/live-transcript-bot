import Discord from 'discord.js';

/**
 * Hack to allow storing commands in Discord client.
 */
interface ClientWithCommands extends Discord.Client {
  commands?: Discord.Collection<string, Command | ConnectionCommand>
};

/**
 * Represents a command object. 
 * Contains command information (name, aliases) as well as a method that runs
 * when the command is called.
 */
interface Command {
  /**
   * The name of the command. `execute` property is run when command name is called.
   */
  name: string,
  /**
   * Whether the command is admin only.
   */
  adminOnly?: boolean,
  /**
   * Alternative ways the user can call the command.
   */
  aliases?: Array<string>,
  /**
   * Description of the command. Shown in help command.
   */
  description: string,
  /**
   * Describes how to use the command. Shown in help command.
   */
  usage?: string,
  /**
   * Method that is run when command is called.
   * @param message 
   * @param args 
   */
  execute(message: MessageWithCommands, args: Array<string>): Promise<void>,
};

/**
 * Represents a command object, except it contains a function that returns a voice connection and the channel of the user's message.
 * Contains command information (name, aliases) as well as a method that runs
 * when the command is called.
 */
 interface ConnectionCommand {
  /**
   * The name of the command. `execute` property is run when command name is called.
   */
  name: string,
  /**
   * Whether the command is admin only.
   */
  adminOnly?: boolean,
  /**
   * Alternative ways the user can call the command.
   */
  aliases?: Array<string>,
  /**
   * Description of the command. Shown in help command.
   */
  description: string,
  /**
   * Describes how to use the command. Shown in help command.
   */
  usage?: string,
  /**
   * Method that is run when command is called.
   * @param message 
   * @param args 
   */
  execute(message: MessageWithCommands, args: Array<string>): Promise<{
    connection: Discord.VoiceConnection | null,
    channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel
  }>,
};

/**
 * Wraps a stream with its corresponding user.
 */
interface StreamWrapper {
  stream: any,
  member: Discord.GuildMember
}

/**
 * Wraps a connection with the corresponding list of audio streams.
 */
interface ConnectionWrapper {
  streams: Array<StreamWrapper>,
  connection: Discord.VoiceConnection
};

/**
 * Wraps a user and their corresponding transcript data.
 */
interface LiveTranscriptData {
  user: Discord.User,
  transcript: string,
  lastUpdate: Date
};

/**
 * Configuration for creating a live transcript embed.
 */
interface LiveTranscriptConfig {
  users: Array<Discord.User>,
  client: Discord.User,
  channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel
}

/**
 * Simplified version of `LiveTranscriptData` that is emitted to the socket.
 */
interface LiveTranscriptDataEmit {
  user: {
    id: string,
    tag: string
  },
  transcript: string,
  /**
   * Date in milliseconds.
   */
  timestamp: number
}

/**
 * MongoDB: Instance of a server.
 */
interface IServer {
  serverId: string,
  prefix: string,
  enableApi: boolean,
  keys: Array<string>
}

/**
 * Message emitted to the socket.
 */
interface SocketMessage {
  code: number,
  error?: string
}

/**
 * Message containing data emitted to the socket.
 */
interface SocketMessageTranscript extends SocketMessage {
  data: Array<{
    user: {
      id: string,
      tag: string
    },
    transcript: string
  }>
};

export { 
  LiveTranscriptConfig,
  IServer,
  LiveTranscriptData,
  LiveTranscriptDataEmit,
  ClientWithCommands, 
  Command, 
  ConnectionCommand, 
  ConnectionWrapper, 
  StreamWrapper,
  SocketMessage,
  SocketMessageTranscript
};