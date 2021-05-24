import mongoose from 'mongoose';
import { IServer } from '../typedefs';

const server = new mongoose.Schema({
  serverId: String,
  prefix: String,
  enableApi: Boolean,
  keys: Array
});

export default mongoose.model<IServer>('server', server);