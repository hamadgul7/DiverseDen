
const mongoose = require('mongoose');

async function connectToDatabase() {
  try {
    // await mongoose.connect('mongodb://localhost:27017/DiverseDen')
    await mongoose.connect('mongodb+srv://cyberghoost902:hamadgul7@dd.zrune.mongodb.net/DiverseDen?retryWrites=true&w=majority&appName=DD');
    // const Product = mongoose.connection.collection('products');
    //     const indexes = await Product.indexes();
    //     console.log('Indexes:', indexes);
        
    console.log('Connected to the database successfully!');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
};

// async function connectToDatabase() {
//   try {
//     // await mongoose.connect('mongodb://localhost:27017/DiverseDen')
//     await mongoose.connect('mongodb+srv://basit01:neOVV1hBacEcNR7L@dd.zrune.mongodb.net/DiverseDen?retryWrites=true&w=majority&appName=DD');
//     console.log('Connected to the database successfully!');
//   } catch (error) {
//     console.error('Failed to connect to the database:', error);
//   }
// };

module.exports = {connectToDatabase: connectToDatabase};

