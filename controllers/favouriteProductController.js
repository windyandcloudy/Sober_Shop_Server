/**
 * @package Controllers
 * @favouriteProduct favouriteProductController
 *
 * @api index() get all favourite product
 * @api create() create a new favourite product
 * @api update() edit and update a favourite product
 * @api delete() delete a favourite product
 */

const FavouriteProduct = require("../models/FavouriteProduct");
const asyncHandle = require("../middlewares/asyncHandle");
const sendResponse = require("../helpers/SendResponse");

module.exports = {
  index: asyncHandle(async (req, res) => {
    const favouriteProduct = await FavouriteProduct.find({ user: req.userId }).populate('product');

    let ar=[]
    for (let i of favouriteProduct){
      let c= ar.find(v=> v?.product?._id===i?.product?._id)
      if (!c){
        ar.push(i)
      }
    }

    return sendResponse(
      res,
      "get list favourite product sucessfully",
      ar
    );
  }),
  create: asyncHandle(async (req, res) => {
    const user = req.userId;
    const favouriteProduct = await FavouriteProduct.create({
      ...req.body,
      user
    });

    return sendResponse(
      res,
      "create a new favourite product sucessfully",
      favouriteProduct
    );
  }),
  update: asyncHandle(async (req, res) => {
    const favouriteProduct = await FavouriteProduct.findByIdAndUpdate(
      req.params.id,
      req.body
    );

    return sendResponse(res, "update sucessfully", favouriteProduct);
  }),
  delete: asyncHandle(async (req, res) => {
    const favouriteProduct = await FavouriteProduct.findByIdAndDelete(
      req.params.id
    );

    return sendResponse(res, "delete sucessfully", favouriteProduct);
  }),
};
