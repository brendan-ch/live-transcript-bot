import Discord from 'discord.js';

import { LiveTranscriptConfig, LiveTranscriptData } from '../typedefs';

/**
 * Class handling a live transcript message.
 */
class LiveTranscript {
  /**
   * Live transcript data for each user.
   */
  protected _dataArray: Array<LiveTranscriptData>;

  /**
   * Discord message instance that will be updated with the transcript data.
   * If `null`, message has not been initiated, or message has been deleted.
   */
  protected _message: Discord.Message | null;

  /**
   * The bot client.
   */
  protected _client: Discord.User;

  /**
   * Date the message was last updated.
   */
  protected _lastUpdate: Date;

  constructor(config: LiveTranscriptConfig) {
    this._dataArray = config.users.map(user => {
      return {
        user: user,
        transcript: ""
      }
    });

    this._message = null;
    this._client = config.client;
    this._lastUpdate = new Date();

    const embed = new Discord.MessageEmbed({
      title: "Live transcript",
      description: this.refreshText()
    });

    config.channel.send(embed)
      .then(message => {
        this._message = message;
      })
      .catch(err => {
        console.error(err);
      })
  };

  /**
   * Data array representing live transcript data.
   */
  get dataArray() {
    return this._dataArray;
  };

  /**
   * Date the message was last updated.
   */
  get lastUpdate() {
    return this._lastUpdate;
  }

  /**
   * Update the transcript for a user.
   * @param user 
   * @param transcript 
   */
  updateTranscript(user: Discord.User, transcript: string) {
    const index = this._dataArray.findIndex(data => data.user.id === user.id);

    if (index !== -1) {
      this._dataArray[index].transcript = transcript
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
    const index = this._dataArray.findIndex(data => data.user.id === user.id);

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
    const index = this._dataArray.findIndex(data => data.user.id === user.id);

    if (index === -1) {
      this._dataArray.push({
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
    const index = this._dataArray.findIndex(data => data.user.id === user.id);

    if (index !== -1) {
      this._dataArray.splice(index, 1);
    } else {
      throw new Error("User doesn't exist in data array.");
    }
  }
  
  /**
   * Create a message embed and store it in `this.message`.
   * @param channel
   */
  async initiate(channel: Discord.TextChannel | Discord.NewsChannel | Discord.DMChannel) {
    const embed = new Discord.MessageEmbed({
      title: "Live transcript",
      description: this.refreshText()
    });
    try {
      this._message = await channel.send(embed);
    } catch(err) {
      console.error(err);
    }
    this._lastUpdate = new Date();
  };

  /**
   * Return text to be used in the message embed.
   */
   private refreshText() {
    const text = this._dataArray.map(data => data.user.id !== this._client.id ? `**__${data.user.tag}__**\n${data.transcript}\n\n` : "").join('');

    return text;
  };
  
  /**
   * Edit the message embed to reflect updated data.
   */
  async refresh() {
    const embed = new Discord.MessageEmbed({
      title: "Live transcript",
      description: this.refreshText()
    });

    try {
      if (this._message) {
        await this._message.edit(embed);

        this._lastUpdate = new Date();
      }
    } catch(err) {
      throw new Error(err);
    }
  };

  /**
   * Delete the embed message.
   * Class instance must be manually destroyed after calling this.
   */
  async destroy() {
    if (this._message) {
      await this._message.delete();
    }

    this._message = null;
    // this.messageExists = false;
  };
}

export { LiveTranscript };