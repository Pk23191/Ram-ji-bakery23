const mongoose = require("mongoose");

const DEFAULT_URI = "mongodb://127.0.0.1:27017/ramji-bakery";
let listenersAttached = false;

function isValidMongoUri(value) {
  return /^mongodb(\+srv)?:\/\//i.test(value);
}

function sanitizeMongoUri(value = "") {
  return value.replace(/\/\/(.*)@/g, "//****@");
}

mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 8000);

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK || "";

  if (!uri || (process.env.MONGODB_URI && !isValidMongoUri(uri))) {
    console.error(
      "MongoDB configuration error: MONGODB_URI must start with mongodb:// or mongodb+srv://"
    );
    throw new Error("Invalid MONGO_URI");
  }

  if (!listenersAttached) {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected");
    });
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error.message);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });
    listenersAttached = true;
  }

  try {
    console.log(`MongoDB connecting to ${sanitizeMongoUri(uri)}`);
    console.log(`MongoDB readyState (before connect): ${mongoose.connection.readyState}`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 8000
    });
    if (conn?.connection?.host) {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    console.log(`MongoDB readyState (after connect): ${mongoose.connection.readyState}`);
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    const isSrvUri = uri.startsWith("mongodb+srv://");
    if (isSrvUri && fallbackUri) {
      try {
        console.warn("Retrying MongoDB connection with fallback standard URI...");
        const fallbackConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 8000,
          socketTimeoutMS: 8000
        });
        if (fallbackConn?.connection?.host) {
          console.log(`MongoDB Connected: ${fallbackConn.connection.host}`);
        }
        return true;
      } catch (fallbackError) {
        console.error("MongoDB fallback connection failed:", fallbackError);
      }
    } else if (isSrvUri && !fallbackUri) {
      console.warn("Set MONGODB_URI_FALLBACK to your standard mongodb:// URI if SRV DNS fails.");
    }
    throw error;
  }
}

module.exports = connectDB;
