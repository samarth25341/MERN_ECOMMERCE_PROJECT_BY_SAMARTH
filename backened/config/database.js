const mongoose = require("mongoose");

const connectDatabase=()=>{
    mongoose.connect(process.env.DB_URL).then((data)=>{
        console.log(`Mongodb connected with its server ${data.Connection.host}`);
        })
};


module.exports=connectDatabase