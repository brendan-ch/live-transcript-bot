import Server from '../models/server';
const defaultPrefix = process.env.DEFAULT_PREFIX;

/**
 * Find server by server ID. If no server exists, create a new one.
 * @param serverId 
 * @returns The server.
 */
const findServer = async (serverId: string, createNewIfNone = true) => {
  // returns null if no server
  const server = await Server.findOne({
    serverId: serverId
  }).exec();

  if (server) {  // a server was found
    await server.save();
    return server;
  } else if (createNewIfNone) {  // no server was found, create new document in database
    const newServer = new Server({
      serverId: serverId,
      prefix: defaultPrefix,
      disabledCommands: [],
    });

    // save new server
    // await: required because saving same document too quickly multiple times will throw error
    await newServer.save();  // saves document for future

    return newServer;  // returns newly created server document
  } else {
    return undefined;
  };
};

export { findServer };
