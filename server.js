let express = require("express");
require("dotenv").config();
let cors = require("cors");
let path = require("path");
const colors = require("colors");
const socketIo = require("socket.io");
const fs = require("fs");
const http = require("http");
const https = require("https");

let app = express();
app.use(express.json());

app.use(
  cors({
    origin: true,
  })
);
// console.log(path.join(__dirname, "./chatwidget/build"));
// Thi 0 t tatic fi og fi th
app.use(express.static(path.join(__dirname, "chatwidget/dist")));

serverInstance = http.createServer(app);
// Initialize Socket.IO function
function initializeSocket(serverInstance) {
  const io = socketIo(serverInstance, {
    pingTimeout: 60000,
    cors: {
      origin: true,
    },
  });

  // Socket.IO connection logic
  io.on("connection", (socket) => {
    console.log(`Connected to socket.io ${socket.id}`.magenta.bold);
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io; // Return the io instance
}

// Initializing Socket.IO
const io = initializeSocket(serverInstance);

const chatMessages = [
  {
    sender: "user",
    content: "hi",
    timestamp: "16:38",
  },
  {
    sender: "bot",
    content: "Try asking something else!",
    timestamp: "16:38",
  },
  {
    sender: "user",
    content: "hello",
    timestamp: "16:38",
  },
  {
    sender: "bot",
    content: "Hello there!",
    timestamp: "16:38",
  },
];
app.get("/sample", (req, res, next) => {
  return res.send({
    status:true,
    message: "oka oka",
  });
});
app.get("/allMessages", (req, res, next) => {
  return res.send({
    status: true,
    data: chatMessages,
  });
});

app.post("/customerMessage", (req, res, next) => {
  chatMessages.push(req.body);
   return res.send({
     status: true,
     content: req.body.content,
     message: "Message Sent",
   });
});

app.post("/userMessage", (req, res, next) => {
    // Get the current time
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;
  
    chatMessages.push({
      sender: "bot",
      content: req.body.content,
      timestamp: formattedTime, // Use the dynamically generated time here
    });
    io.sockets.emit("message received", {
      sender: "bot",
      content: req.body.content,
      timestamp: formattedTime, // Use the dynamically generated time here
    });
    console.log(chatMessages.length);
    return res.send({
      message: "oka oka",
    });
  });

  app.get("/getfiles", (req, res, next) => {
    const jsFolder = "./chatwidget/dist/assets";
    const cssFolder = "./chatwidget/dist/assets";
  
    let jsFiles = [];
    let cssFiles = [];
  
    // Fetch all JS files
    fs.readdirSync(jsFolder).forEach((eachFile) => {
      if (eachFile.endsWith(".js")) {
        jsFiles.push(`/assets/${eachFile}`); // Include path for serving
      }
    });
  
    // Fetch all CSS files
    fs.readdirSync(cssFolder).forEach((eachFile) => {
      if (eachFile.endsWith(".css")) {
        cssFiles.push(`/assets/${eachFile}`); // Include path for serving
      }
    });
  
    res.send({
      jsFiles,
      cssFiles,
    });
  });
  

console.log(process.env.PORT);
const PORT = process.env.PORT || 8890;
serverInstance.listen(
  PORT,
  console.log(`server started on port ${PORT}`.yellow.bold)
);

