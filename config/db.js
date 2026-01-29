const mongoose = require("mongoose");

exports.connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log(`DB connected with: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
