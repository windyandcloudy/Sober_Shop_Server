/**
 * @package Controllers
 * @category feedbackController
 *
 * @api show() Show feedback by id
 * @api create() Create a feedback
 * @api update() Update a feedback
 * @api delete() Delete a feedback
 *
 * @author Huu Ngoc Developer huungoc1994hd@gmail.com
 * @date 31/05/2021
 */

const Feedback = require("../models/Feedback");
const asyncHandle = require("../middlewares/asyncHandle");
const sendResponse = require('../helpers/SendResponse');

module.exports = {
  show: asyncHandle(async (req, res) => {
    const order_detail = req.params.order_detail_id;

    const feedbacks = await Feedback.find({ order_detail }).populate({
      path: "order_detail",
      populate: {
        path: "product"
      }
    });

    return sendResponse(res, "Show all product successfully", feedbacks);
  }),

  create: asyncHandle(async (req, res) => {
    const feedback = await Feedback.create({
      ...req.body,
      user: req.userId
    });

    return sendResponse(res, "Create feedback successfully", feedback);
  }),

  update: asyncHandle(async (req, res) => {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body);

    return sendResponse(res, "Update feedback successfully", feedback);
  }),

  delete: asyncHandle(async (req, res) => {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    return sendResponse(res, "Delete feedback successfully", feedback);
  }),
};
