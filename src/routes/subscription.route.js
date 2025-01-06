import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); 

router.route("/c/:channelId/toggle").post(toggleSubscription);

router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers);

router.route("/user/subscribed").get(getSubscribedChannels);


export default router