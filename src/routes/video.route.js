import {Router} from "express"

import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller" 

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

router.route("/publishAVideo").post(
    upload.fields([
        {
            name: "video",
            maxCount: 1
        }
    ]),
    publishAVideo
)
