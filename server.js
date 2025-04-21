const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
const port = 3009;

// Middleware
app.use(cors());
app.use(express.json());

// Route
const apiRoutes = require("./api");
app.use("/", apiRoutes);

// Create server
const server = http.createServer(app);

// Socket
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

require("./socket")(io); // ส่ง io เข้า socket.js

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
