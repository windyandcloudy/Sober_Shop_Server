const ErrorResponse= require("../helpers/ErrorResponse")
const asyncHandle= require("../middlewares/asyncHandle")
const User= require("../models/User")
const sendResponse = require("../helpers/SendResponse");

module.exports= {
  getAll: asyncHandle(async(req, res, next)=>{
    const page = +req.query.page || 1;
        const limit = +req.query.limit || 10;
        const startIndex = (page - 1) * limit;
        const total = await User.countDocuments();
        const totalPage = Math.ceil(total / limit);
        const pagination = {
        page,
        limit,
        total,
        totalPage,
        };
        const users = await User.find({}).skip(startIndex)
        .limit(limit);;

        return sendResponse(res, "Get list user successfully.", users, pagination);
        
  }),
  delete: asyncHandle(async(req, res, next)=>{
    
  })
}