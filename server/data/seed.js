const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('../models/productModel'); // Ensure this path is correct
require('dotenv').config({ path: './server/.env' });

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const data = JSON.parse(fs.readFileSync('./server/data/products.json', 'utf-8'));
    
    await Product.deleteMany(); // Clear existing
    await Product.insertMany(data);

    console.log("Data Seeded Successfully!");
    process.exit();
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
};

seedDatabase();