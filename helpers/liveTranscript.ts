import Discord from 'discord.js';
import bcrypt from 'bcrypt';
import { Socket } from 'socket.io';

import { LiveTranscriptConfig, LiveTranscriptData, LiveTranscriptDataEmit, SocketError } from '../typedefs';
import { findServer } from './server';
import { authError } from './registerSocket';

const liveTranscripts: Array<LiveTranscript> = [];

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

  /**
   * Socket linked to the live transcript instance.
   */
  protected _socket: Socket | null;
  
  /**
   * The API key of the socket accessing the transcript.
   */
  protected _socketKey: string | null;

  constructor(config: LiveTranscriptConfig) {
    this._dataArray = config.users.map(user => {
      return {
        user: user,
        transcript: ""
      }
    });

    this._message = null;
    this._socket = null;
    this._socketKey = null;
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
   * Message containing the live transcript.
   */
  get message() {
    return this._message;
  }

  /**
   * Socket that is linked to the live transcript instance. 
   */
  get socket() {
    return this._socket;
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

      this.emitSocket();
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

      this.emitSocket();
    } else {
      throw new Error("User already exists in data array.");
    }
  };

  /**
   * Add a socket to the live transcript instance. 
   * @param socket 
   */
  addSocket(socket: Socket, apiKey: string) {
    console.log(`Registering socket ${socket.id} to live transcript`);
  
    this._socket = socket;
    this._socketKey = apiKey;
  }

  /**
   * Clear the socket from the live transcript instance.
   */
  removeSocket() {
    this._socket = null;
  }

  /**
   * Emit a serialized version of the dataArray to the socket.
   */
  async emitSocket() {
    if (this._socket && this._socketKey && this._message) {
      // Check if authentication credentials are still valid
      const err = await authError(this._socket, this._message.guild!.id, this._socketKey);
      if (err) {
        this._socket = null;
        this._socketKey = null;
        return;
      };

      const simpleDataArray: Array<LiveTranscriptDataEmit> = this._dataArray.map(data => {
        return {
          transcript: data.transcript,
          user: {
            id: data.user.id,
            tag: data.user.tag
          }
        }
      });

      console.log(simpleDataArray);

      this._socket.emit("transcript:update", simpleDataArray);
    }
  }

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
    this._socket = null;
    this._socketKey = null;
    // this.messageExists = false;
  };
}

/**
 * Add a live transcript to an array.
 * @param liveTranscript 
 */
function addLiveTranscript(liveTranscript: LiveTranscript) {
  liveTranscripts.push(liveTranscript);
};

/**
 * Get all ongoing live transcripts.
 */
function getLiveTranscripts() {
  return liveTranscripts;
}

/**
 * Remove references to the live transcript with the specified server ID.
 * @param serverId 
 */
function removeLiveTranscript(serverId: string) {
  const index = liveTranscripts.findIndex(liveTranscript => (liveTranscript.message ? liveTranscript.message.guild!.id : null) === serverId);

  if (index !== -1) {
    liveTranscripts.splice(index, 1);
  } else {
    console.error("Live transcript doesn't exist in array.");
  }
}

export { LiveTranscript, addLiveTranscript, getLiveTranscripts, removeLiveTranscript };