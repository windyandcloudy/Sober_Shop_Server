const express = require('express');
const router = require('./routers');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const cors = require('cors');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//       "Access-Control-Allow-Headers",
//       "Origin, X-Requested-With, Content-Type, Accept"
//     );
//     next();
// });

connectDB();

const PORT = process.env.PORT || 5000;

router(app);

app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
})