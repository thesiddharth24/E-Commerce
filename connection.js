const mongoose = require('mongoose')

const  password = encodeURIComponent("#Santu2001");
const Mongo_URL =`mongodb+srv://siddharthgupta5678:${password}@cluster0.zr2rj5f.mongodb.net/?retryWrites=true&w=majority`
const connectDB= async () =>{
   try {
      
         const connectionInstance = await mongoose.connect(`${Mongo_URL}`);
         console.log(`Mongo db Connected  !! DB Host -- !! ${connectionInstance.connection.host}`);

   } catch (error) {
         console.log("MONGODB connection error" , error);
         process.exit(1);
   }
}


module.exports = connectDB;