let express = require("express");
require("dotenv").config();
let cors = require("cors");
const bodyParser = require("body-parser");
let path = require("path");
const colors = require("colors");
const socketIo = require("socket.io");
const fs = require("fs");
const http = require("http");
const https = require("https");
const axios = require("axios");

let app = express();
app.use(
  bodyParser.json({
    limit: "10mb",
  })
); // Adjust the limit as needed
app.use(
  bodyParser.urlencoded({
    limit: "10mb",
    extended: true,
  })
); // Adjust the limit as needed
const allowedOrigins = process.env.SYS_ORIGIN.split(",");
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
app.use(
  cors({
    origin: true,
  })
);
app.use(cors(corsOptions));
// console.log(path.join(__dirname, "./chatwidget/build"));
// Thi 0 t tatic fi og fi th
app.use(bodyParser.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
// parse requests of content-type - application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static(path.join(__dirname, "chatwidget/dist")));

// Create server instance based on environment
let serverInstance;
if (process.env.NODE_ENV === "development") {
  // In development, create an HTTP server
  serverInstance = http.createServer(app);
} else {
  // In production, create an HTTPS server with SSL key and certificate
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY), // SSL Key from .env
    cert: fs.readFileSync(process.env.SSL_CRT), // SSL Cert from .env
  };
  serverInstance = https.createServer(options, app);
}
// Initialize Socket.IO function
function initializeSocket(serverInstance) {
  const io = socketIo(serverInstance, {
    pingTimeout: 60000,
   cors: {
     origin: allowedOrigins,
   },
    path: "/widgetsocket.io",
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
    status: true,
    message: "oka oka",
  });
});
app.get("/allMessages", (req, res, next) => {
  return res.send({
    status: true,
    data: chatMessages,
  });
});

app.post("/customerMessage", async (req, res, next) => {
  try {
    // Add the incoming message to the chatMessages array
    chatMessages.push(req.body);
    console.log("req.body", req.body);

    // Send the payload (req.body) to the outbound webhook URL
    const webhookUrl = process.env.outboundWebhook;
    console.log("webhookUrl", webhookUrl);
    // Making POST request to the webhook
    let responseContent = "Message sent and forwarded to the webhook";
    if (req.body.customerInfo) {
      let chatPayload = req.body.customerInfo;
      chatPayload.appId = process.env.outboundAppID;
      chatPayload.type = "text";
      chatPayload.channel = "web";
      (chatPayload.ChatId = req.body.ChatId),
        (chatPayload.messages = [
          {
            senderType: "customer",
            timestamp: Date.now().toString(), // Current timestamp
            channelId: 129731,
            type: "message",
            text: {
              content: req.body.content, // Using the content sent by the customer
            },
          },
        ]);
      const headers = {
        "token-id": process.env.outboundAppToken,
        "client-id": process.env.outboundAppClient,
      };

      await axios.post(webhookUrl, chatPayload, {
        headers,
      });
    } else {
      responseContent =
        "Message Not forwarded to the webhook: no customer Data";
    }

    // Respond to the client that the message was sent successfully
    return res.send({
      status: true,
      content: responseContent,
      message: "Message sent and forwarded to the webhook",
    });
  } catch (error) {
    console.error("Error sending to webhook:", error.message);
    // Handle the error and respond with an appropriate message
    return res.status(200).send({
      status: true,
      message: "webhook Error",
    });
  }
});

app.post("/userMessage", (req, res, next) => {
  // Get the current time
  const currentTime = new Date();
  const hours = currentTime.getHours().toString().padStart(2, "0");
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const formattedTime = `${hours}:${minutes}`;
  console.log("req.body", req.body);
  chatMessages.push({
    sender: "bot",
    content: req.body.message.content,
    timestamp: formattedTime, // Use the dynamically generated time here
  });
  io.sockets.emit("message received", {
    sender: "bot",
    content: req.body.message.content,
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
// Start the server
const PORT = process.env.PORT || 8890;
serverInstance.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`.yellow.bold);
});
