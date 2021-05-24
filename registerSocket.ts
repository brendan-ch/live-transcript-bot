import bcrypt from 'bcrypt';

import { Server, Socket } from 'socket.io';
import { getLiveTranscripts } from './helpers/liveTranscript';
import { findServer } from './helpers/server';

const io = new Server();

/**
 * Register socket events.
 * @param socket 
 */
function registerSocket(socket: Socket) {
  socket.on('transcript:subscribe', async function(serverId?: string, apiKey?: string) {
    if (!serverId || !apiKey) {
      const error = "No server ID or API key specified.";
      socket.emit('error', error);

      return;
    }

    console.log(`Socket ${socket.id} subscribing to updates from server ${serverId}`);

    // TO-DO: check if server ID matches up with authentication
    const server = await findServer(serverId);

    const matchArray: Array<Promise<boolean>> = server.keys.map(key => {
      return bcrypt.compare(apiKey, key);
    })

    const matchResults = await Promise.all(matchArray);
    if (!matchResults.includes(true)) {
      socket.emit('error', "API key is invalid.");

      return;
    };
    // const keyToCheck = await bcrypt.hash(apiKey, 10);
    // console.log(keyToCheck);

    // check if API key exists in server keys
    // if (!server.keys.includes(keyToCheck)) {
    //   socket.emit('error', "API key is invalid.");
      
    //   return;
    // };

    const liveTranscript = getLiveTranscripts().find(
      transcript => (transcript.message ? transcript.message.guild!.id : null) === serverId
    );

    liveTranscript?.addSocket(socket);
  });

  socket.on('disconnect', (reason) => {
    const liveTranscript = getLiveTranscripts().find(
      transcript => (transcript.socket ? transcript.socket.id : null) === socket.id
    );

    liveTranscript?.removeSocket();
  })
}

function registerConnection() {
  console.log("Registering socket connection....");

  io.on('connection', (socket: Socket) => {
    console.log(`Socket ${socket.id} connected.`);

    registerSocket(socket);
  });

  io.listen(3000);
};

export { registerConnection };