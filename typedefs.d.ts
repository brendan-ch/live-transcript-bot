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
  execute(message: MessageWithCommands, args: Array<string>): Promise<undefined>,
};

/**
 * Represents a command object, except it contains a function that returns a voice connection.. 
 * Contains command information (name, aliases) as well as a method that runs
 * when the command is called.
 */
 interface ConnectionCommand {
  /**
   * The name of the command. `execute` property is run when command name is called.
   */
  name: string,
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

export { ClientWithCommands, Command, ConnectionCommand, ConnectionWrapper, StreamWrapper };