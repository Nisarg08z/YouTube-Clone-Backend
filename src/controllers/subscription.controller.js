import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user.id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId === subscriberId) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId,
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(true, "Unsubscribed successfully"));
    }

    const newSubscription = await Subscription.create({
        channel: channelId,
        subscriber: subscriberId,
    });

    return res
        .status(201)
        .json(new ApiResponse(true, "Subscribed successfully", newSubscription));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({ channel: channelId }).populate(
        "subscriber",
        "name email"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(true, "Channel subscribers fetched successfully", subscribers)
        );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user.id;

    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate(
        "channel",
        "name email"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(true, "Subscribed channels fetched successfully", subscriptions)
        );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
