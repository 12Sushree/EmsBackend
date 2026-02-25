const express = require("express");
const { connectDB } = require("./config/db");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/authRoutes");
const attendanceRouter = require("./routes/attendanceRoutes");
const taskRouter = require("./routes/taskRoutes");
const leaveRouter = require("./routes/leaveRoutes");
const announcementRouter = require("./routes/announcementRoutes");
const userRouter = require("./routes/userRoutes");
const performanceRouter = require("./routes/performanceRoutes");
const managerRouter = require("./routes/managerRoutes");
const tokenRouter = require("./routes/tokenRoutes");
require("./jobs/leaveStatusJob");
require("./jobs/attendanceStatusJob");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ems-frontend-two-chi.vercel.app",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  }),
);
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/leave", leaveRouter);
app.use("/api/announcement", announcementRouter);
app.use("/api/user", userRouter);
app.use("/api/performance", performanceRouter);
app.use("/api/manager", managerRouter);
app.use("/api/token", tokenRouter);

app.listen(port, async () => {
  await connectDB();
  console.log(`Server is active on port ${port}`);
});
