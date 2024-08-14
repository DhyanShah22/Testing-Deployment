const express = require('express');
const app = express();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const logger = require('./config/logger');
const dotenv = require('dotenv');

dotenv.config();
connectDB();

app.use(express.json());
app.use('/api', userRoutes);

app.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${process.env.PORT}`);
});
