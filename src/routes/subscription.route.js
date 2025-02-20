import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isChannelFollowed
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/c/:channelId/toggle").post(verifyJWT, toggleSubscription);

router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers);

router.route("/user/subscribed").get(verifyJWT, getSubscribedChannels);

router.route("/check/c/:channelId").post(verifyJWT, isChannelFollowed);


export default router