const express = require("express");
const router = require("./routers");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const cors = require("cors");
const path = require("path");

const paypal = require("paypal-rest-sdk");

const orderModel = require("./models/Order");

const ErrorResponse = require("./helpers/ErrorResponse");
const asyncHandle = require("./middlewares/asyncHandle");
const Order = require("./models/Order");
const OrderDetail = require("./models/OrderDetail");
const User = require("./models/User");
const Cart = require("./models/Cart");
const mongoose = require("mongoose");
const Product = require("./models/Product");

const { verifyAccessToken } = require("./middlewares/verifyToken");
const permission = require("./middlewares/permission");

const errorHandle = require("./middlewares/errorHandle");

const { mongooseToObject } = require("./util/convert");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AaC17qAgEh6PYcDSgp8NbUbFIssqY-ZPmd77ue_2K8vLYivjeHbeNwjGwDqS4Z3b2gh2U3Ir51ATuItA",
  client_secret:
    "EJQBMfWTfW5cU4s11l_Ftb1Oql19YE84IioRcjYTRq83YPnwfzFYb9Ny-4OG2MWIjooapnnGtOoo8026",
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
let globalAddress;
app.post(
  "/api/pay",
  verifyAccessToken,
  permission("user"),
  asyncHandle(async function (req, res, next) {
    let bd = req.body;
    //nhớ tạo order
    const userId = req.userId;

    let id_order;
    const { address, phoneNumber, carts } = req.body;
    globalAddress = address;
    // Simple validation
    if (!carts) {
      return next(new ErrorResponse(400, "Lack of information"));
    }

    // Create session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const options = { session };

      const user = await User.findOne({ _id: userId }, null, options);

      if (!user) {
        await session.abortTransaction();
        session.endSession();

        return next(new ErrorResponse(404, "User not found"));
      }

      // Check for existing product in user's cart and delete them
      const productsInCart = await Promise.all(
        carts.map(async (cartId) => {
          const cart = await Cart.findOneAndDelete(
            { _id: cartId, user: userId },
            options
          ).populate("product");

          const product = await Product.findById(
            cart.product._id,
            null,
            options
          );
          product.sold += cart.quantity;
          product.quantity = product.quantity - cart.quantity;
          await product.save();

          return cart;
        })
      );

      const totalAmount = productsInCart.reduce((total, cart) => {
        const { quantity, product } = cart;
        const { price, discount } = product;

        return total + quantity * (price * ((100 - discount) / 100));
      }, 0);

      // Check user's account balance
      // if(user.accountBalance < totalAmount) {
      //     await session.abortTransaction();
      //     session.endSession();

      //     return next(new ErrorResponse(400, "User's account balance is not enough for payment"));
      // }
      console.log("taoj order");
      const order = await Order.create(
        [
          {
            user: userId,
            address: address || "HN",
            phoneNumber: phoneNumber || "0983154433",
            totalAmount,
          },
        ],
        options
      );

      const newOrder = order[0];
      id_order = order[0]._id;
      // user.accountBalance -= totalAmount;
      await user.save();

      // Transfer money to recipient's account
      const receiver = await User.findOne(
        { username: "badong2001" },
        null,
        options
      );

      if (!receiver) {
        await session.abortTransaction();
        session.endSession();

        return next(new ErrorResponse(404, "Receiver not found"));
      }

      receiver.accountBalance += totalAmount;
      await receiver.save();

      // Create array detail of order
      const orderDetailArray = productsInCart.map((cart) => {
        return {
          order: newOrder._id,
          product: cart.product._id,
          quantity: cart.quantity,
          discount: cart.product.discount,
          price: cart.product.price,
        };
      });

      const orderDetails = await OrderDetail.insertMany(
        orderDetailArray,
        options
      );

      // End session
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      return next(new ErrorResponse(400, error.message));
    }

    console.log(id_order);
    //tạo order
    console.log("taoj xong order: " + id_order);
    let obj = bd.carts.map((v) => ({
      name: v.product.name,
      quantity: v.quantity,
      price: v.product.price - (v.product.price * v.product.discount) / 100,
      currency: "USD",
      sku: v.product.listImage[0],
    }));
    console.log("obj: ");
    console.log(obj);

    let total =
      (obj || 0) &&
      obj.reduce(
        (pre, curr) => pre + Number(curr.price) * Number(curr.quantity),
        0
      );
    console.log("total: " + total);
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `http://localhost:5000/api/success?total=${total}&id_order=${id_order}`,
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
            // res.redirect(payment.links[i].href);
            res.json(payment);
          }
        }
      }
    });
  })
);

app.get("/api/cancle", function (req, res) {
  res.render("cancle");
});
app.get("/api/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const total = req.query.total;
  const id_order = req.query.id_order;

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
          address: globalAddress || address,
          payment_method: "paypal",
        };

        let newOrder = await orderModel.findByIdAndUpdate(id_order, bd, {
          new: true,
        });

        // res.json({
        //   abc: payment.transactions[0].item_list?.items,
        //   order: newOrder,
        // });
        // console.log("server: " + payment?.transactions?.item_list);
        res.render("success", {
          data: {
            payment: payment?.transactions[0]?.item_list?.items,
            order: newOrder,
          },
        });
      }
    }
  );
});
app.use(errorHandle);
app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});
