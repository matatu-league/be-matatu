// create a separate script called drop-db.js
import mongoose from 'mongoose';

async function dropDB() {
  await mongoose.connect('mongodb://localhost:27017/matatu');
  await mongoose.connection.db.dropDatabase();
  console.log('Database dropped');
  process.exit(0);
}

dropDB().catch(console.error);