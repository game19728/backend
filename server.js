const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
const port = 3009;


app.use(cors());
app.use(express.json());




const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

require("./socket")(io);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
