const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderDetailSchema = new Schema({
    discount: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    order: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'orders',
    },
    product: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'products',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

OrderDetailSchema.virtual('amount').get(function() {
    return this.quantity * ( this.price - this.price * (this.discount/100));
})

module.exports = mongoose.model('orderDetails', OrderDetailSchema);
