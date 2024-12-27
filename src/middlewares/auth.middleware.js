import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"
import jwt from "jsonwebtoken"
import { User } from "../models/User"


export const verifyJWT = asyncHandler(async(req, res, next) => {
try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        await User.findById(decodedToken?._id).select.("-password -refreshToken")
    
        if(!user) {
            throw new ApiError(404, "User not found")
        }
    
        req.User = user
        next()
} catch (error) {
    throw new ApiError(401, "error")
}

})