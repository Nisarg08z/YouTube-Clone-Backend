import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        verifyJWT,publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(verifyJWT,deleteVideo)
    .patch(upload.single("thumbnail"),verifyJWT, updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT,togglePublishStatus);

router.route("/user/:userId").get(getAllVideos)

export default router