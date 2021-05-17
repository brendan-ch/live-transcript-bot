// Helper file for handling user's audio streams.
import Discord from 'discord.js';
import fs from 'fs';

function handleConnection(connection: Discord.VoiceConnection) {
  connection.on('speaking', function(user, speaking) {
    if (speaking.bitfield === 0 || user.bot) {
      return;
    };

    console.log(`Listening to user ${user.tag}`);

    const stream = connection.receiver.createStream(user, {
      mode: 'opus'
    });
    // // stream.pipe(fs.createWriteStream(`${user.id}.mp3`));

    // play the stream?
    connection.play(stream, {
      type: 'opus'
    });

    stream.on('error', function(err) {
      console.error(err);
    });

    // stream.on('data', function(chunk) {
    //   console.log(chunk);
    // });

    stream.on('end', function() {
      console.log(`Audio stream closed for user ${user.tag}`);
    })
  });

  connection.on('ready', function() {
    console.log(`Bot joined VC ${connection.channel.id}`);
  })

  connection.on('disconnect', function(err) {
    console.log(`Bot disconnected from VC ${connection.channel.id}`);
    if (err) console.error(err);
  });
};

export { handleConnection };