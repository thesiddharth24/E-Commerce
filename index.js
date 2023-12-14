const express = require("express")
const server = express();
const cors = require('cors')
const PORT = 8080;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
//Authentication 
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;


const connectDB = require('./connection');

const {User} = require('./models/User.js')

const productRouter = require('./routes/Product');
const categories = require('./routes/Category');
const brands = require('./routes/Brand');
const users = require('./routes/User');
const auth = require('./routes/Auth');
const cart = require('./routes/Cart');
const order = require('./routes/Order');

const {isAuth , sanitizeUser , cookieExtractor} = require('./services/common')


//
// Webhook

const endpointSecret = process.env.ENDPOINT_SECRET;

server.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
 
    // Handle the event
 switch (event.type) {
  case 'payment_intent.succeeded':
    const paymentIntentSucceeded = event.data.object;

    const order = await Order.findById(
      paymentIntentSucceeded.metadata.orderId
    );
    order.paymentStatus = 'received';
    await order.save();

    break;
  // ... handle other event types
  default:
    console.log(`Unhandled event type ${event.type}`);
}

// Return a 200 response to acknowledge receipt of the event
response.send();
}
);


//JWT token 
const SECRET_KEY = 'SECRET_KEY';
const token = jwt.sign({},SECRET_KEY)


//JWT options 
const opts = {}
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = SECRET_KEY;


//mongodb
//mongoose connection 
connectDB()
.then( () => {
    //app.listen se phle err bhi listen karke dekh lo 
    server.on("ERROR",(error)=>{
        console.log("ERR:",error);
        throw error;
    });
})
.catch( (err) => {
    console.log("MPNGO DB connevtion is failed !! ", err)
})

//middleware 
server.use(express.json());//
server.use(cors({
    exposedHeaders:['X-Total-Count']
}));
server.use(express.static('build'));
server.use(
    session({
      secret: 'keyboard cat',
      resave: false, // don't save session if unmodified
      saveUninitialized: false, // don't create session until something stored
    })
  );
server.use(cookieParser());  
server.use(passport.authenticate('session'));


server.use("/products",isAuth(),productRouter.router)
server.use("/categories",categories.router)
server.use("/brands",brands.router)
server.use("/users",users.router)
server.use("/auth",auth.router)
server.use("/cart",cart.router)
server.use("/orders",order.router)


//Passport stratigies 
passport.use('local',
    new LocalStrategy(
        {usernameField:'email'},
        async function(email, password, done) {
        //By default passport uses username 
        try {
            const user = await User.findOne({ email: email });
            console.log(email,password,user)
            if(!user){
                done(null, false , {message: `Invalid email!!`})
              
            }
            crypto.pbkdf2(
                password,
                user.salt,
                310000,
                32,
                'sha256',
                async function (err, hashedPassword){
                    //hased passowrd hamare dene wale password ka hased version hai 
                    
                     if(!crypto.timingSafeEqual(user.password , hashedPassword)){
                        done(null , false , { message: "Invalid credential !!"});
                      
                    }else{
                        const token = jwt.sign(sanitizeUser(user),SECRET_KEY)
                        done(null , { id: user.id, role: user.role, token }); // this thing call serealize 
                    }
                })


          
            
          } catch (err) {
            done(err);
          }
    }
  ));

passport.use('jwt',new JwtStrategy(opts,async function(jwt_payload, done) {
    console.log({jwt_payload})
    try {
        const user = await User.findOne({id: jwt_payload.id});
            
            if (user) {
                return done(null, sanitizeUser(user)); // this call serializer
            } else {
                return done(null, false);
                // or you could create a new account
            }
        
    } catch (err) {
        return done(err, false);
    }
    
}));

  // this creates session variable req.user on being called from callbacks
passport.serializeUser(function (user, cb) {
    console.log('serialize' , user);
    process.nextTick(function () {
      return cb(null, { id: user.id, role: user.role });
    });
  });
  
  // this changes session variable req.user when called from authorized request
  
  passport.deserializeUser(function (user, cb) {
    console.log('deserializeUser' , user);
    process.nextTick(function () {
      return cb(null, user);  
    });
  });


// Payments

// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY);

server.post('/create-payment-intent', async (req, res) => {
  const { totalAmount, orderId } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100, // for decimal compensation
    currency: 'inr',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

main().catch((err) => console.log(err));  




server.listen(PORT , ()=>{
    console.log(`Server is listening on ${PORT}`);
})  