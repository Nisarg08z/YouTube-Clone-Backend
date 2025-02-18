import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user.id,
    });

    return res
        .status(201)
        .json(new ApiResponse(true, "Tweet created successfully", tweet));
});
 
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const tweets = await Tweet.find({ owner: userId }).populate("owner", "fullName username avatar");

    return res
        .status(200)
        .json(new ApiResponse(true, "User tweets fetched successfully", tweets));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user.id },
        { $set: { content } },
        { new: true }
    );

    if (!updatedTweet) {
        throw new ApiError(404, "Tweet not found or unauthorized");
    }

    return res
        .status(200)
        .json(new ApiResponse(true, "Tweet updated successfully", updatedTweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user.id,
    });

    if (!deletedTweet) {
        throw new ApiError(404, "Tweet not found or unauthorized");
    }

    return res
        .status(200)
        .json(new ApiResponse(true, "Tweet deleted successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
};
