const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AXwk_6fVQ72Ezs8bfr5PGnrsRtYcezNk1PKaTyn49Ki-z9kpfk-8Urcj5-oMLzD_5XFUG0N9nebFADQo",
  client_secret:
    "EDut9pT7a4Av5hdROdB1O9NHmEer48q_ifF2xQiVCucyCUV-ncjAAf3OMmuOamveqNICmxSNG8DDdwEd",
});

module.exports={
  buy: function(req, res){
    res.render("index")
  },
  pay: function(req, res){
    let obj=[
      {
        "name": "Red Sox Hat",
        "sku": "001",
        "price": "1.0",
        "currency": "USD",
        "quantity": 15
      },
      {
        "name": "Blue Sox Hat",
        "sku": "002",
        "price": "1.5",
        "currency": "USD",
        "quantity": 1
      },
      {
        "name": "Blue Sox Hat",
        "sku": "003",
        "price": "1.5",
        "currency": "USD",
        "quantity": 1
      },
      {
        "name": "Blue Sox Hat",
        "sku": "004",
        "price": "1.5",
        "currency": "USD",
        "quantity": 1
      }
    ]

    // let items= req.body
    let items= obj
    let total= 10
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:5000/api/paypal/success?total="+ total,
        cancel_url: "http://localhost:5000/api/paypal/cancle",
      },
      transactions: [
        {
          item_list: {
            items: items,
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
        console.log(error)
        res.render("cancle");
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  },
  success: function(req, res){
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const total= req.query.total;
  
  
    console.log("payer id: "+payerId)
    console.log("payer id: "+paymentId)
  
    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: total.toString(),
          },
        },
      ],
    };
  
    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      function (error, payment) {
        if (error) {
          res.render("cancle");
        } else {
          console.log(JSON.stringify(payment));
          res.render("success");
        }
      }
    );
  }, 
  cancel: function(req, res){
    res.render("cancle");
  }
}