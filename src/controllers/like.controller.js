import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({ video: videoId, user: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(true, "Video unliked successfully"));
    }

    const newLike = await Like.create({ video: videoId, user: userId });
    return res.status(201).json(new ApiResponse(true, "Video liked successfully", newLike));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({ comment: commentId, user: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(true, "Comment unliked successfully"));
    }

    const newLike = await Like.create({ comment: commentId, user: userId });
    return res.status(201).json(new ApiResponse(true, "Comment liked successfully", newLike));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({ tweet: tweetId, user: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(true, "Tweet unliked successfully"));
    }

    const newLike = await Like.create({ tweet: tweetId, user: userId });
    return res.status(201).json(new ApiResponse(true, "Tweet liked successfully", newLike));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const likedVideos = await Like.find({ user: userId, video: { $exists: true } })
        .populate("video", "title description")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(true, "Liked videos fetched successfully", likedVideos));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
};
