const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors=require("../middleware/catchAsyncErrors");
const User=require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail=require("../utils/sendEmail.js");
const crypto=require("crypto");

//Register a user
exports.registerUser=catchAsyncErrors(async(req,res,next)=>{

const {name,email,password}=req.body;

const user = await User.create({
    name,email,password,
    avatar:{
        public_id:"this is a sample id",
        url:"profilepicurl"
    }
});

const token = user.getJWTToken();

sendToken(user,201,res); 
});

//LOGIN user
exports.loginUser=catchAsyncErrors(async(req,res,next)=>{

const {email,password}=req.body;

//checking if user has given both password and email both
if(!email || !password){
    return next(new ErrorHander("Please Enter Email & Password",400));
}

const user=await User.findOne({email}).select("+password");

if(!user){
    return next(new ErrorHander("Invalid email or password",401));
}

const isPasswordMatched=user.comparePassword(password);
if(!isPasswordMatched){
    return next(new ErrorHander("Invalid email or password",401));
}


sendToken(user,200,res);

});



//Logout user 
exports.logout=catchAsyncErrors(async(req,res,next)=>{

    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true,
    })

    res.status(200).json({
        success:true,
        message:"logged out"
    });

});

// Forgot Password
exports.forgotPassword=catchAsyncErrors(async(req,res,next)=>{

    const user =await User.findOne({email:req.body.email});

    if(!user){
        return next(new ErrorHander("User not found",404))
    }

    // get reset password token
    const resetToken=user.getResetPasswordToken();

    await user.save({validateBeforeSave:false});

    const resetPasswordUrl=`${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message=`Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it`;

    try{

await sendEmail({
email:user.email,
subject:`Ecommerce Password Recovery`,
message,
});

res.status(200).json({
    success:true,
    message:` Email sent to ${user.email} successfully`
})

    }
    catch(err){
        user.resetPasswordToken=undefined;
        user.resetPasswordExpire=undefined;

        await user.save({validateBeforeSave:false});
        return next(new ErrorHander(err.message,500));
    }
});

//Reset Password
exports.resetPassword=catchAsyncErrors(async(req,res,next)=>{


//creating token hash
const resetPasswordToken=crypto.createHash("sha256").update(req.params.token).digest("hex");

const user=await User.findOne({
    resetPasswordToken,
    resetPasswordExpire:{$gt:Date.now()},
});

if(!user){
    return next(new ErrorHander("Reset Password Token is invalid or has been expired",404));
}

if(req.body.password !== req.body.confirmPassword){
    return next(new ErrorHander("Reset Password Token is invalid or has been expired",404));
}

user.password=req.body.password;
user.resetPasswordToken=undefined;
user.resetPasswordExpire=undefined;

await user.save();

sendToken(user,200,res);
}

)

// GET USER DETAILS 
exports.getUserDetails=catchAsyncErrors(async(req,res,next)=>{

const user=await User.findById(req.user.id);

res.status(200).json({
    success:true,
    user,
});
});

// update USER password
exports.updatePassword=catchAsyncErrors(async(req,res,next)=>{

    const user=await User.findById(req.user.id).select("+password");


    const isPasswordMatched=user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatched){
        return next(new ErrorHander("Old password is incorrect ",400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHander("password does not match ",400));
    }

    user.password=req.body.newPassword;

   await user.save();

sendToken(user,200,res);
    });

    // update USER profile

// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
    };
  
    if (req.body.avatar !== "") {
      const user = await User.findById(req.user.id);
  
      const imageId = user.avatar.public_id;
  
      await cloudinary.v2.uploader.destroy(imageId);
  
      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
  
      newUserData.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
  
    
    const user=await User.findByIdAndUpdate(req.user.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false,
    })

res.status(200).json({
    success:true,
});
    });

    //Get all users(admin)

    exports.getAllUser=catchAsyncErrors(async(req,res,next)=>{
        const users=await User.find();
        res.status(200).json({
            success:true,
            users
        })
    });

    //Get single user(admin)

    exports.getSingleUser=catchAsyncErrors(async(req,res,next)=>{
        const user=await User.findById(req.params.id);

        if(!user){
            return next(new ErrorHander(`User does not exist with id:${req.params.id}`))
        }


        res.status(200).json({
            success:true,
            user
        })
    });

    //update user role
    exports.updateUserRole=catchAsyncErrors(async(req,res,next)=>{

        const newUserData={
            name:req.body.name,
            email:req.body.email,
            role:req.body.role
        };
    
       
        const user=await User.findByIdAndUpdate(req.params.id,newUserData,{
            new:true,
            runValidators:true,
            useFindAndModify:false,
        })

        if(!user){
            return next(new ErrorHander(`user does not exit with Id:${req.params.id}`),400);
        }
    
    res.status(200).json({
        success:true,
    });
        });

        //delete user admin

        exports.deleteUser=catchAsyncErrors(async(req,res,next)=>{

          const user=await User.findById(req.params.id);
            //We will remove cloudinary later

            if(!user){
                return next(new ErrorHander(`user does not exit with Id:${req.params.id}`),400);
            }
            
            await user.remove();
        
        res.status(200).json({
            success:true,
            message:"User deleted successfully"
        });
            });