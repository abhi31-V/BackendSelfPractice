import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) // it will not apply the validation its directly save the data
        
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(
    async (req,res) =>{
    
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

       const {fullName, email, username, password } = req.body
       if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    const userExisted = await User.findOne({
        $or: [ {username}, {email}] // these are for operator
    })
     
    if(userExisted){
        throw new ApiError(409, "User Already Exists")
    }


    // as we add middlewarew of multer so it will give us the access of files
    console.log(req.files,"multer files")
    const avatarLocalPath = req.files?.avatar[0]?.path
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log(avatarLocalPath,coverImageLocalPath,"path")
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar Image is Required")
    }

    if(!avatar){
        throw new ApiError(400, "Avatar file is Required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(  // select method remove the field we dont want in our records
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
    }
)


const loginUser = asyncHandler(
    async (req,res)=>{
const {username, email, password} = req.body;
console.log(email)

if (!username && !email) {
    throw new ApiError(400, "username or email is required")
}
const user = await User.findOne(
   { $or:[{username}, {email}]}
)
if (!user) {
    throw new ApiError(404, "User does not exist")
}

const isPasswordValid = await user.isPasswordCorrect(password); // we use user because it's our method and user is the instance of our data


if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials")
}

const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
const options ={
    httpOnly:true,
    secure: true
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(
        200, 
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
    )
)


    }
)


const logoutUser = asyncHandler(
    async (req,res)=>{ // if response is empty then we used '_'
// now we have access of user in request as we inject this user object through middleware 
User.findByIdAndUpdate(req.user._id,
   { $set:{
        refreshToken: undefined
    }
},
    {
        new: true
    }
)

const options = {
    httpOnly: true,
    secure: true
}

return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiResponse(200, {}, "User logged Out"))
    }
)


const refreshAccessToken = asyncHandler(
    async (req,res) => {
        const incomingRequestToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRequestToken){
            throw new ApiError(401, "Invalid Token")
        }
       try {
         const decodedToken = jwt.verify(incomingRequestToken, process.env.REFRESH_TOKEN_SECRET);
         const user = await User.findById(decodedToken._id);
         if(!user){
             throw new ApiError(401, "Invalid refresh Token")
         }
         if(user.refreshToken!==incomingRequestToken){
             throw new ApiError(401, "Refresh token is expired or used")
         }
 
         const options = {
             httpOnly: true,
             secure: true
         }
         const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
         console.log(accessToken,refreshToken)
     
         return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", refreshToken, options)
         .json(
             new ApiResponse(
                 200, 
                 {accessToken, refreshToken: refreshToken},
                 "Access token refreshed"
             )
         )
       } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
        
       }
    } 

    
)

export {logoutUser, registerUser, loginUser, refreshAccessToken}