const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userModel= require("../models/User")
const bcrypt= require("bcrypt")

dotenv.config();

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URI, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        let user= await userModel.findOne({username: "admin1234"})
        if (!user){
            const hashedPassword = await bcrypt.hash("admin1234@", 10);
            await userModel.create({
                username: "admin1234",
                password: hashedPassword,
                email: "anhduy10701001234@gmail.com",
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