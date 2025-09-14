const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

let db;

const connectToDb = (callback) => {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in the .env file.');
  }
  if (!dbName) {
    throw new Error('DB_NAME is not defined in the .env file.');
  }

  MongoClient.connect(mongoUri)
    .then((client) => {
      db = client.db(dbName);
      console.log(`Connected to MongoDB database: ${dbName}`);
      return callback();
    })
    .catch((err) => {
      console.error(err);
      return callback(err);
    });
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not connected!');
  }
  return db;
};

module.exports = { connectToDb, getDb };
