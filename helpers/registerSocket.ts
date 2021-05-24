import bcrypt from 'bcrypt';

import { Server, Socket } from 'socket.io';
import { getLiveTranscripts } from './liveTranscript';
import { findServer } from './server';
import { SocketError } from '../typedefs';

const io = new Server();

/**
 * Register socket events.
 * @param socket 
 */
function registerSocket(socket: Socket) {
  socket.on('transcript:subscribe', async function(serverId?: string, apiKey?: string) {
    if (!serverId || !apiKey) {
      const error: SocketError = {
        code: 400,
        message: "Bad request: no API key or server ID specified."
      };
      socket.emit('error', error);

      return;
    }

    const err = await authError(socket, serverId, apiKey);
    if (err) return;

    const liveTranscript = getLiveTranscripts().find(
      transcript => (transcript.message ? transcript.message.guild!.id : null) === serverId
    );

    if (!liveTranscript) {
      const error: SocketError = {
        code: 404,
        message: "Not found: no active transcript instance linked to this server"
      };

      socket.emit('error', error);
    }

    console.log(`Socket ${socket.id} subscribing to updates from server ${serverId}`);

    liveTranscript?.addSocket(socket, apiKey);
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

async function authError(socket: Socket, serverId: string, apiKey: string) {
  const server = await findServer(serverId, false);
    if (!server) {
      const error: SocketError = {
        code: 404,
        message: "Not found: server not found"
      }

      socket.emit('error', error);

      return true;
    } else if (!server.enableApi) {
      const error: SocketError = {
        code: 403,
        message: "Forbidden: server has API disabled"
      }

      socket.emit('error', error);

      return true;
    }

    const matchArray: Array<Promise<boolean>> = server.keys.map(key => {
      return bcrypt.compare(apiKey, key);
    })

    const matchResults = await Promise.all(matchArray);
    if (!matchResults.includes(true)) {
      const error: SocketError = {
        code: 401,
        message: "Unauthorized: API key invalid."
      };

      socket.emit('error', error);

      return true;
    };
    
    return false;
}

export { registerConnection, authError };