import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import uploadOnCloudinary  from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens = async(userId) => 
    {
    try {
       const user =  await User.findById(userId)
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({validateBeforeSave: false})

       return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;
    console.log("email:", email);
    

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    //console.log(req.files);

    // Validate avatar file
    const avatarLocalPath =
        req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0
            ? req.files.avatar[0].path
            : null;

    if (!avatarLocalPath) {
        return res.status(400).json({ error:"Avatar file is required"});
    }

    // Validate cover image file
    const coverImageLocalPath =
        req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0
            ? req.files.coverImage[0].path
            : null;

    console.log("Avatar file path:", avatarLocalPath);
    console.log("Cover image file path:", coverImageLocalPath);

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : { url: "" };

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar file");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});
const loginUser = asyncHandler(async (req, res) =>{
     // req body -> data
     // username or email
     // find the user
     // password check
     //access and refresh token
     // send cookie


     const {email, username, password} = req.body

     if ( !username || !email) {
        throw new ApiError(400, "username or email is required")

     }
     
     const user = await User.findOne({
        $or: [{username}, {email}]
     })
     if (!user) {
        throw new ApiError(404, "User does not exist")
     }

     const isPasswordValid = await user.isPasswordCorrect(password)
     if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
        }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(username._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
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
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged in Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
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
})



export { registerUser, loginUser, logoutUser } 
