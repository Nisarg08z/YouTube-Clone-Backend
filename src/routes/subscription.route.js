import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isChannelFollowed
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); 

router.route("/c/:channelId/toggle").post(toggleSubscription);

router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers);

router.route("/user/subscribed").get(getSubscribedChannels);

router.route("/check/c/:channelId").post(isChannelFollowed);


export default router