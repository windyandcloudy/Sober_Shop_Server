const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^[a-zA-Z0-9]{8,}$/,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    fullname: String,
    role: {
        type: String,
        enum: ['admin', 'user'],
        required: true,
        default: 'user',
    },
    phoneNumber: {
        type: String,
        match: /^[0][0-9]{9}$/,
    },
    address: String,
    accountBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    deleted: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('users', UserSchema);
