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

    const totalVideos = await Video.countDocuments({
        channel: channelId
    });

    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    const totalLikes = await Like.countDocuments({
        video: {
            $in: (await Video.find({
                channel: channelId
            }).select("_id"))
        }
    });

    const totalViews = await Video.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null, totalViews: {
                    $sum: "$views"
                }
            }
        },
    ]);

    return res.status(200).json(
        new ApiResponse(true, "Channel stats fetched successfully", {
            totalVideos,
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

    const videos = await Video.find({ channel: channelId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select("title description views likes createdAt");

    return res.status(200).json(
        new ApiResponse(true, "Channel videos fetched successfully", videos)
    );
});

export {
    getChannelStats,
    getChannelVideos,
};
