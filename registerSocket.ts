import { Server, Socket } from 'socket.io';
import { getLiveTranscripts } from './helpers/liveTranscript';
const io = new Server();

/**
 * Register socket events.
 * @param socket 
 */
function registerSocket(socket: Socket) {
  socket.on('transcript:subscribe', function(serverId: string) {
    console.log(`Socket ${socket.id} subscribing to updates from server ${serverId}`);

    // TO-DO: check if server ID matches up with authentication

    const liveTranscript = getLiveTranscripts().find(
      transcript => (transcript.message ? transcript.message.guild!.id : null) === serverId
    );

    liveTranscript?.addSocket(socket);
  });

  socket.on('disconnect', (reason) => {
    const liveTranscript = getLiveTranscripts().find(
      transcript => transcript.socket ? transcript.socket.id : null === socket.id
    );

    liveTranscript?.removeSocket();
  })
}

function registerConnection() {
  console.log("Registering connection....");

  io.on('connection', (socket: Socket) => {
    console.log(`Socket ${socket.id} connected.`);

    registerSocket(socket);
  });

  io.listen(3000);
};

export { registerConnection };