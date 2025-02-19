import { mongoose, isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    const totalLikes = await Like.countDocuments({
        video: {
            $in: (await Video.find({
                owner: channelId
            }).select("_id"))
        }
    });

    const totalViews = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: { $ifNull: ["$views", 0] } }
            }
        }
    ]);
    
    return res.status(200).json(
        new ApiResponse(true, "Channel stats fetched successfully", {
            totalSubscribers,
            totalLikes,
            totalViews: totalViews[0]?.totalViews || 0,
        })
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },

        {
            $lookup: {
                from: "likes",
                let: { videoId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
                    { $project: { likedBy: 1 } },
                ],
                as: "likes",
            },
        },

        {
            $addFields: {
                likesCount: { $size: "$likes" },
            },
        },

        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                likesCount: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(true, "Channel videos fetched successfully", videos)
    );
});


export {
    getChannelStats,
    getChannelVideos,
};
