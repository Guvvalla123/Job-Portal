/**
 * In-memory MongoDB for isolated tests (parallel-safe per Jest worker).
 * Does not replace CI Mongo for legacy integration files that connect explicitly.
 */
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer = null;

async function connect() {
  if (mongoServer) {
    return;
  }
  mongoServer = await MongoMemoryServer.create({
    instance: { launchTimeout: 120000 },
  });
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
}

async function clearDb() {
  if (mongoose.connection.readyState === 0) return;
  const cols = mongoose.connection.collections;
  await Promise.all(Object.keys(cols).map((k) => cols[k].deleteMany({})));
}

async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

module.exports = { connect, clearDb, disconnect };
