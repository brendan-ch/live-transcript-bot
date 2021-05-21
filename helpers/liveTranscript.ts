import Discord from 'discord.js';

import { LiveTranscriptConfig, LiveTranscriptData } from '../typedefs';

/**
 * Class handling a live transcript message.
 */
class LiveTranscript {
  /**
   * Live transcript data for each user.
   */
  protected dataArray: Array<LiveTranscriptData>;

  /**
   * Discord message instance that will be updated with the transcript data.
   */
  // @ts-ignore
  protected message: Discord.Message;
  protected client: Discord.User;

  constructor(config: LiveTranscriptConfig) {
    this.dataArray = config.users.map(user => {
      return {
        user: user,
        transcript: ""
      }
    });

    this.client = config.client;

    this.initiate(config.channel);
  };

  /**
   * Get data in the LiveTranscript instance.
   */
  getData() {
    return this.dataArray;
  };

  /**
   * Update the transcript for a user.
   * @param user 
   * @param transcript 
   */
  updateTranscript(user: Discord.User, transcript: string) {
    const index = this.dataArray.findIndex(data => data.user.id === user.id);

    if (index !== -1) {
      this.dataArray[index].transcript = transcript
    } else {
      throw new Error("User doesn't exist in data array. Did you add the user using method addUser?");
    };
  };

  /**
   * Update the transcript for a user, and add the user instance if not present in data array.
   * @param user 
   * @param transcript 
   */
  addOrUpdateTranscript(user: Discord.User, transcript: string) {
    const index = this.dataArray.findIndex(data => data.user.id === user.id);

    if (index !== -1) {
      this.updateTranscript(user, transcript);
    } else {
      this.addUser(user);
      this.updateTranscript(user, transcript);
    };
  }

  /**
   * Add a user to the data array.
   * @param user 
   * @throws If user already exists in array.
   */
  addUser(user: Discord.User) {
    // check if user exists already
    const index = this.dataArray.findIndex(data => data.user.id === user.id);

    if (index === -1) {
      this.dataArray.push({
        user: user,
        transcript: ""
      });
    } else {
      throw new Error("User already exists in data array.");
    }
  };

  /**
   * Remove a user from the data array.
   * @param user 
   * @throws If user doesn't exist in array.
   */
  removeUser(user: Discord.User) {
    const index = this.dataArray.findIndex(data => data.user.id === user.id);

    if (index !== -1) {
      this.dataArray.splice(index, 1);
    } else {
      throw new Error("User doesn't exist in data array.");
    }
  }

  /**
   * Return text to be used in the message embed.
   */
  private refreshText() {
    const text = `${
      this.dataArray.map(data => data.user.id !== this.client.id ? `**__${data.user.tag}__**\n${data.transcript}\n\n` : "")
    }`;

    return text;
  };
  
  /**
   * Create a message embed and store it in `this.message`.
   * @param channel
   */
  async initiate(channel: Discord.TextChannel | Discord.NewsChannel | Discord.DMChannel) {
    const embed = new Discord.MessageEmbed({
      title: "Live transcript",
      description: this.refreshText()
    });

    this.message = await channel.send(embed);    
  };
  
  /**
   * Edit the message embed to reflect updated data.
   */
  async refresh() {
    const embed = new Discord.MessageEmbed({
      title: "Live transcript",
      description: this.refreshText()
    });

    await this.message.edit(embed);
  };

  /**
   * Delete the embed message.
   * Class instance must be manually destroyed after calling this.
   */
  async destroy() {
    await this.message.delete();
  };
}

export { LiveTranscript };