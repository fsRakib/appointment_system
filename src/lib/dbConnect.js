import mongoose from "mongoose";

const connection = {};

async function dbConnect() {
  if (connection.isConnected) {
    // console.log(
    //   "------------✅ Already connected to the database ------------"
    // );
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "", {
      dbName: "Eeffective_Learning_db",
    });
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not set");
    connection.isConnected = db.connections[0].readyState;

    console.log("------------✅ Database connected successfully ------------");
  } catch (error) {
    console.error(
      "------------------------ Database connection failed -----------------------:",
      error.message
    );
    console.error("MongoDB URI exists:", !!process.env.MONGODB_URI);
    throw new Error(`Failed to connect to the database: ${error.message}`);
  }
}

export default dbConnect;
