const express= require("express")
const router= express.Router()

const {
  buy, pay, success, cancel
}= require("../controllers/paypalController")

router
  .route("/")
  .get(buy)

router
  .route("/pay")
  .post(pay)

router
  .route("/success")
  .get(success)  

router
  .route("/cancle")
  .get(cancel)  

module.exports= router