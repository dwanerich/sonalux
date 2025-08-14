
import mongoose from 'mongoose';

let conn = global._gmi_mongoose;
if (!conn){
  conn = mongoose.createConnection(process.env.MONGO_URI, { dbName: undefined });
  global._gmi_mongoose = conn;
}
export default conn;
