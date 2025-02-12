import mongoose,{ isValidObjectId } from "mongoose";
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

    console.log(userId)

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(true, "Video unliked successfully"));
    }

    await Like.updateOne(
        { video: videoId, likedBy: userId },
        { $setOnInsert: { video: videoId, likedBy: userId } },
        { upsert: true }
    );

    return res.status(201).json(new ApiResponse(true, "Video liked successfully"));
});

const isVideoLiked = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    //console.log("--------",existingLike)

    if (existingLike) {
        return res.status(200).json(new ApiResponse(true, "Video already liked by you"));
    }

    return res.status(200).json(new ApiResponse(false, "Video not liked by you"));

})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(true, "Comment unliked successfully"));
    }

    const newLike = await Like.create({ comment: commentId, likedBy: userId });
    return res.status(201).json(new ApiResponse(true, "Comment liked successfully", newLike));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(true, "Tweet unliked successfully"));
    }

    const newLike = await Like.create({ tweet: tweetId, likedBy: userId });
    return res.status(201).json(new ApiResponse(true, "Tweet liked successfully", newLike));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const likedVideos = await Like.aggregate([
        {
            $match: { likedBy: new mongoose.Types.ObjectId(userId), video: { $exists: true } },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
            },
        },
        {
            $unwind: "$video",
        },
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "uploader",
            },
        },
        {
            $unwind: "$uploader",
        },
        {
            $project: {
                _id: "$video._id",
                videoFile: "$video.videoFile",
                thumbnail: "$video.thumbnail",
                title: "$video.title",
                description: "$video.description",
                duration: "$video.duration",
                views: "$video.views",
                isPublished: "$video.isPublished",
                createdAt: "$video.createdAt",
                updatedAt: "$video.updatedAt",
                likedAt: "$createdAt",
                "uploader.fullName": 1,
                "uploader.avatar": 1,
                "uploader.username": 1,
            },
        },
        { $sort: { likedAt: -1 } }, // Sorting by the liked timestamp
    ]);

    return res
        .status(200)
        .json(new ApiResponse(true, "Liked videos fetched successfully", likedVideos));
});



export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    isVideoLiked
};
