require("dotenv").config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URL;

mongoose.connect(uri).then(()=>{
  console.log("DataBase is Connected ")
}).catch((e)=>{
  console.log(`DataBase Connect Failed ${e}`);
})