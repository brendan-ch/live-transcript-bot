// Helper file for handling user's audio streams.
import Discord from 'discord.js';

import gSpeech from '@google-cloud/speech';
import { LiveTranscript } from './liveTranscript';
const speech = gSpeech.v1p1beta1;
const speechClient = new speech.SpeechClient({
  keyFilename: 'stt-gcloud-key.json'
});

/**
 * Handle voice connections and live transcript updates.
 * @param connection 
 * @param liveTranscript 
 * @returns Promise that resolves when bot is disconnected from VC.
 */
function handleConnection(
  connection: Discord.VoiceConnection, 
  liveTranscript: LiveTranscript
) {
  const promise = new Promise(function(resolve, reject) {
    connection.on('speaking', function(user, speaking) {
      if (speaking.bitfield === 0 || user.bot) {
        return;
      };
  
      console.log(`Listening to user ${user.tag}`);

      // Transcribe a stream using the Google Speech client
      const recognizeStream = speechClient.streamingRecognize({
        config: {
          audioChannelCount: 2,
          encoding: "LINEAR16",
          languageCode: "en-US",
          sampleRateHertz: 48000
        },
        interimResults: true
      })
        .on('readable', () => {
          console.log("Receiving data");
        })
        .on('error', console.error)
        .on('data', data => {
          process.stdout.write(
            data.results[0] && data.results[0].alternatives[0]
              ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
              : '\n\nReached transcription time limit, press Ctrl+C\n'
          );
        });
  
      const stream = connection.receiver.createStream(user, {
        mode: 'pcm'
      });
      stream.pipe(recognizeStream);

      let bufferArray: Array<Buffer> = [];
  
      stream.on('error', function(err) {
        console.error(err);
      });
  
      stream.on('data', function(chunk) {
        bufferArray.push(chunk);
      });
  
      stream.on('end', function() {
        const buffer = Buffer.concat(bufferArray);
        
        // Disable buffer conversion to save on Google Cloud credits
        // convertAudio(buffer)
        //   .then(newBuffer => {
        //     return transcribe(newBuffer);
        //   })
        //   .then(transcript => {
        //     if (transcript) {
        //       // TO-DO: Fix crash if message doesn't exist
        //       console.log(`${user.tag}: ${transcript}`);

        //       try {
        //         liveTranscript.addOrUpdateTranscript(user, transcript);
        //         liveTranscript.refresh();
        //       } catch(err) {
        //         console.error(err);
        //       }
        //     }
            
        //   });

        console.log(`Audio stream closed for user ${user.tag}`);
      })
    });
  
    connection.on('ready', function() {
      console.log(`Bot joined VC ${connection.channel.id}`);
    })
  
    connection.on('disconnect', function(err) {
      console.log(`Bot disconnected from VC ${connection.channel.id}`);

      liveTranscript.destroy();

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

/**
 * Transcribe a buffer using the Google Speech client.
 * @param buffer 
 * @returns The transcript returned by the client.
 */
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