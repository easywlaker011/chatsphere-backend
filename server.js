import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io"


// express app and http server
const app = express();
const server = http.createServer(app)

// initsizalize socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
});

// store online users
export const userSocketMap = {}; // {userId: socketId}
// socket io connection handler
io.on("connection", (socket)=> {
     const userId = socket.handshake.query.userId;
     console.log("User Connected", userId);

     if (userId) userSocketMap[userId] = socket.id

    //  emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", ()=> {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// middleware setup
app.use(express.json({limit: "10mb"}));
app.use(cors());

// routes setup
app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)


//connect mongo db
await connectDB();

const PORT = process.env.PORT || 10000;
server.listen(PORT, ()=> console.log("server is running on port: " + PORT));