
const mongoose = require('mongoose');

async function connectToDatabase() {
  try {
    await mongoose.connect('mongodb+srv://cyberghoost902:hamadgul7@dd.zrune.mongodb.net/DiverseDen?retryWrites=true&w=majority&appName=DD');
        
    console.log('Connected to the database successfully!');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
};


module.exports = {connectToDatabase: connectToDatabase};

