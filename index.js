const express = require("express");
const router = require("./routers");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const cors = require("cors");
const path = require("path");

const paypal = require("paypal-rest-sdk");

const orderModel = require("./models/Order");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AXwk_6fVQ72Ezs8bfr5PGnrsRtYcezNk1PKaTyn49Ki-z9kpfk-8Urcj5-oMLzD_5XFUG0N9nebFADQo",
  client_secret:
    "EDut9pT7a4Av5hdROdB1O9NHmEer48q_ifF2xQiVCucyCUV-ncjAAf3OMmuOamveqNICmxSNG8DDdwEd",
});

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//       "Access-Control-Allow-Headers",
//       "Origin, X-Requested-With, Content-Type, Accept"
//     );
//     next();
// });

app.set("views", path.join(__dirname, "views"));
// app.engine("ejs", )
app.set("view engine", "ejs");

connectDB();

const PORT = process.env.PORT || 5000;

router(app);

app.get("/", function (req, res) {
  res.render("index");
});

app.post("/api/pay", function (req, res) {
  let obj = req.body;
  let id_order = req.query.id_order;
  let total =
    (obj || 0) &&
    obj.reduce(
      (pre, curr) => pre + Number(curr.price) * Number(curr.quantity),
      0
    );
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url:
        "http://localhost:5000/api/success?total=" +
        total +
        "&id_order=" +
        id_order,
      cancel_url: "http://localhost:5000/api/cancel",
    },
    transactions: [
      {
        item_list: {
          items: obj,
        },
        amount: {
          currency: "USD",
          total: total.toString(),
        },
        description: "Hat for the best team ever",
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      console.log("Error pay: " + error);
      res.render("cancle");
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          console.log("di qua 83");
          // res.redirect(payment.links[i].href);
          res.json(payment);
        }
      }
    }
  });
});
app.get("/api/cancle", function (req, res) {
  res.render("cancle");
});
app.get("/api/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const total = req.query.total;
  const id_order = req.query.id_order;

  console.log(payerId);
  console.log(paymentId);
  console.log(total);
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: total,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    async function (error, payment) {
      if (error) {
        console.log("Error success: " + error);
        res.render("cancle");
      } else {
        let shipping_address = payment.payer.payer_info.shipping_address;
        let address =
          shipping_address.recipient_name +
          " " +
          shipping_address.line1 +
          " " +
          shipping_address.line2 +
          " " +
          shipping_address.city +
          " " +
          shipping_address.state;

        let bd = {
          address: address,
          payment_method: "paypal",
        };

        let newOrder = await orderModel.findByIdAndUpdate(id_order, bd, {
          new: true,
        });

        res.render("success");
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});
