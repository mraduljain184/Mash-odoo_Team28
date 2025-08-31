require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
// const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const { setIO } = require('./Utils/io');


const errorHandler = require('./Middlewares/errorHandler.middleware.js');
const connectDB = require('./Models/db');

const app = express();
// Create HTTP server for app (useful for websockets later)
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
setIO(io);

// Middleware
app.use(helmet());
// <<<<<<< HEAD
// app.use(
//   cors({
//     origin: ["https://mash-odoo-team28.vercel.app", "http://localhost:3000"],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
// app.use(express.json());
// =======
app.use(cors({
  origin: '*'
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to the Admin Panel");
});

io.on('connection', (socket) => {
  // rooms for roles could be added later
  socket.on('join', (room) => socket.join(room));
});

// Routes
app.use('/api/auth', require('./Routes/auth.router.js'));
app.use('/api/user', require('./Routes/user.router.js'));
app.use('/api/workshops', require('./Routes/workshop.router.js'));
app.use('/api/services', require('./Routes/service.router.js'));
app.use('/api/admin', require('./Routes/admin.router.js'));
app.use('/api/cloudinary', require('./Routes/cloudinary.router.js'));
app.use('/api/reviews', require('./Routes/review.router.js'));


// Error handler LAST
app.use(errorHandler);

// MongoDB connection
connectDB().then(() => {
  server.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port", process.env.PORT || 5000);
  });
});
