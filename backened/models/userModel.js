const mongoose=require("mongoose");
const validator=require("validator");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const crypto=require("crypto");

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter your name"],
        maxLength:[30,"name cannot exceed 30 characters"],
        minLength:[4,"name should have more than 4 characters"]
    },
    email:{
        type:String,
        required:[true,"enter your email"],
        unique:true,
        validate:[validator.isEmail,"please enter valid email"]
    },
    password:{
        type:String,
        required:[true,"please enter yor password"],
        minLength:[8,"passowrd should be greater than 8 characters"],
        select:false
    },
    avatar:{
        
            public_id:{
                type:String,
                required:true   
            },
            url:{
                type:String,
                required:true   
            }        
    },
    role:{
        type:String,
        default:"user",
    },
      createdAt:{
         type:Date,
         default:Date.now
      },
    resetPasswordToken:String,
    resetPasswordExpire:Date,

});

userSchema.pre("save",async function(next){

      if(!this.isModified("password")){
    next();
      }

    this.password=await bcrypt.hash(this.password,10);

});

// JWT TOKEN
userSchema.methods.getJWTToken = function(){
return jwt.sign({id:this._id},process.env.JWT_SECRET,{
    expiresIn:process.env.JWT_EXPIRE,
});
};

//compare password
userSchema.methods.comparePassword=async function(enterdPassword){
return await bcrypt.compare(enterdPassword,this.password);
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function(){
// generating token 
const resetToken=crypto.randomBytes(20).toString("hex");

//hashing and adding to userSchema
this.resetPasswordToken=crypto.createHash("sha256").update(resetToken).digest("hex");

this.resetPasswordToken=Date.now()+15*60**1000;

return resetToken;

};




module.exports=mongoose.model("User",userSchema);