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

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "fullName username avatar")
        .lean();

    for (let subscriber of subscribers) {
        const count = await Subscription.countDocuments({ subscriber: subscriber.subscriber._id });
        subscriber.subscriber.subscriptionsCount = count; 
    }

    return res.status(200).json(
        new ApiResponse(true, "Channel subscribers fetched successfully", subscribers)
    );
});



const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user.id;

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "fullName username avatar")
        .lean(); 

    for (let subscription of subscriptions) {
        const count = await Subscription.countDocuments({ channel: subscription.channel._id });
        subscription.channel.subscribersCount = count; 
    }

    return res.status(200).json(
        new ApiResponse(true, "Subscribed channels fetched successfully", subscriptions)
    );
});


const isChannelFollowed = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const existingFollow = await Subscription.findOne({ channel: channelId, subscriber: userId });

    //console.log("--------",existingFollow)

    if (existingFollow) {
        return res.status(200).json(new ApiResponse(true, "channel already Followed by you"));
    }

    return res.status(200).json(new ApiResponse(false, "channel not Followed by you"));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isChannelFollowed
};
