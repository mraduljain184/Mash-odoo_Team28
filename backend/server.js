require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');


const errorHandler = require('./Middlewares/errorHandler.middleware.js');
const connectDB = require('./Models/db');


const app = express();
// Create HTTP server for app (useful for websockets later)
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the Admin Panel');
});




// Routes
app.use('/api/auth', require('./Routes/auth.router.js'));
app.use('/api/user', require('./Routes/user.router.js'));
app.use('/api/workshops', require('./Routes/workshop.router.js'));


// Error handler LAST
app.use(errorHandler);

// MongoDB connection
connectDB().then(() => {
  server.listen(process.env.PORT || 5000, () => {
    console.log('Server running on port', process.env.PORT || 5000);
  });
});