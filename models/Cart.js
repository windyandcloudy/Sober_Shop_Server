const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('carts', CartSchema);
