const app=require("./app");

const dotenv = require("dotenv");
const connectDatabase=require("./config/database")

//handling uncaught exceptions

process.on("uncaughtException",(err)=>{
console.log(`Error:${err.message}`);
console.log(`shutting down server due to uncaught exception`);
process.exit(1);
})

//config

dotenv.config({path:"backened/config/config.env"});

//connecting to database
connectDatabase()


const server=app.listen(process.env.PORT,()=>{
    console.log(`Server is working on http://localhost:${process.env.PORT}`)
})

//unhandles promise rejection
process.on("unhandledRejection",err=>{
    console.log(`Error:${err.message}`);
    console.log(`shutting down the servor due to unhandled promise rejection`);

server.close(()=>{
    process.exit(1);
});

});