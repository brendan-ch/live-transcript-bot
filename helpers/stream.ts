// Helper file for handling user's audio streams.
import Discord from 'discord.js';

import gSpeech from '@google-cloud/speech';
import { LiveTranscript, addLiveTranscript, removeLiveTranscript } from './liveTranscript';
const speech = gSpeech.v1p1beta1;
const speechClient = new speech.SpeechClient({
  keyFilename: 'stt-gcloud-key.json'
});

function handleConnection(connection: Discord.VoiceConnection, liveTranscript: LiveTranscript) {
  addLiveTranscript(liveTranscript);

  const promise = new Promise(function(resolve, reject) {
    connection.on('speaking', function(user, speaking) {
      if (speaking.bitfield === 0 || user.bot) {
        return;
      };
  
      console.log(`Listening to user ${user.tag}`);
  
      const stream = connection.receiver.createStream(user, {
        mode: 'pcm'
      });

      let bufferArray: Array<Buffer> = [];
  
      stream.on('error', function(err) {
        console.error(err);
      });
  
      stream.on('data', function(chunk) {
        bufferArray.push(chunk);
      });
  
      stream.on('end', function() {
        const buffer = Buffer.concat(bufferArray);
        convertAudio(buffer)
          .then(newBuffer => {
            return transcribe(newBuffer);
          })
          .then(transcript => {
            if (transcript) {
              console.log(`${user.tag}: ${transcript}`);

              handleTranscript(user, transcript, liveTranscript)
                .catch(err => {
                  console.error(err);
                })
              
            }
            
          });

        console.log(`Audio stream closed for user ${user.tag}`);
      })
    });
  
    connection.on('ready', function() {
      console.log(`Bot joined VC ${connection.channel.id}`);
    })
  
    connection.on('disconnect', function(err) {
      console.log(`Bot disconnected from VC ${connection.channel.id}`);

      liveTranscript.destroy();

      removeLiveTranscript(connection.channel.guild.id);

      resolve('Disconnected from VC');
      if (err) console.error(err);
    });
  });

  return promise;
};

/**
 * Handle transcript updates.
 * @param user 
 * @param transcript 
 * @param liveTranscript 
 */
 async function handleTranscript(
  user: Discord.User, 
  transcript: string, 
  liveTranscript: LiveTranscript
) {
  // TO-DO: Add socket event for transcript updates (public API)

  // update the message
  try {
    liveTranscript.addOrUpdateTranscript(user, transcript);
    
    // delay for message updates (affects how often message is updated)
    const delay = process.env.MESSAGE_DELAY ? Number(process.env.MESSAGE_DELAY) : undefined;

    if (liveTranscript.lastUpdate.getTime() > (delay && !isNaN(delay) ? delay : 1000)) {
      liveTranscript.refresh();
    }
  } catch(err) {
    throw new Error(err);
  }
}

// async function transcribeFileStream(userId: string) {
//   const config = {
//     encoding: "LINEAR16",
//     sampleRateHertz: 48000,
//     languageCode: "en-US"
//   };

//   const request = {
//     config: config,
//     interimResults: true
//   };

//   // @ts-ignore
//   const recognizeStream = speechClient.streamingRecognize(request)
//     .on('readable', () => {
//       console.log("Receiving data");
//     })
//     .on('error', console.error)
//     .on('data', data => {
//       console.log("Received data");
//       console.log(data);
//       // process.stdout.write(
//       //   data.results[0] && data.results[0].alternatives[0]
//       //     ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
//       //     : '\n\nReached transcription time limit, press Ctrl+C\n'
//       // )
//     })

//   fs.createReadStream(userId).pipe(recognizeStream);
// }

// async function transcribeFile(userId: string) {
//   const audio = {
//     content: fs.readFileSync(userId).toString('base64')
//   };

//   // console.log(audio);

//   const [response] = await speechClient.recognize({
//     config: {
//       encoding: 'LINEAR16',
//       sampleRateHertz: 48000,
//       languageCode: 'en-US',
//       model: 'video',
//     },
//     audio: audio
//   });

//   const transcription = response.results
//     .map(result => result.alternatives[0].transcript)
//     .join('\n');
//   console.log('Transcription: ', transcription);
// };

async function convertAudio(input: Buffer) {
  try {
    // stereo to mono channel
    const data = new Int16Array(input)
    const ndata = new Int16Array(data.length/2)
    for (let i = 0, j = 0; i < data.length; i+=4) {
        ndata[j++] = data[i]
        ndata[j++] = data[i+1]
    }
      return Buffer.from(ndata);
  } catch (e) {
    console.log(e)
    console.log('convert_audio: ' + e)
    throw e;
  }
};

async function transcribe(buffer: Buffer) {
  try {
    const bytes = buffer.toString('base64');

    const [response] = await speechClient.recognize({
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true
      },
      audio: {
        content: bytes
      }
    });
    
    // construct transcript
    if (response.results) {
      const transcript = response.results
        .map(result => result.alternatives ? result.alternatives[0].transcript : "")
        .join('\n');

      return transcript;
    }
    
  } catch(err) {
    console.error(err);
  }
}

export { handleConnection };