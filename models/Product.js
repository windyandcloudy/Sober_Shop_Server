const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
    }, 
    thumb: {
        type: [String],
        required: true,
    }, 
    listImage: {
        type: [String],
        default: undefined,
    },
    price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    }, 
    evaluation: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        default: '',
    },
    sold: {
        type: Number,
        default: 0,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('products', ProductSchema);
