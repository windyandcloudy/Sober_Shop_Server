const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userModel= require("../models/User")

dotenv.config();

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URI, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        let user= await userModel.findOne({username: "admin123456"})
        if (!user){
            await userModel.create({
                username: "admin123456",
                password: "admin123456@",
                email: "anhduy0701001234@gmail.com",
                role: "admin"
            })
        }

        console.log('Connected DB success');
    } catch (error) {
        console.log('Connect DB failed : ', error.message);
        process.exit(1);
    }
}

module.exports = connectDB;