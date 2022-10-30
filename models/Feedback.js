const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema({
    comment: {
        type: String,
        default: '',
    },
    rating_star: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users',
    },
    order_detail: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'orderDetails',
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('feedbacks', FeedbackSchema);
