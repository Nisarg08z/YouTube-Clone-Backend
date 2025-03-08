import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/").post(createPlaylist, verifyJWT)

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist, verifyJWT)
    .delete(deletePlaylist, verifyJWT);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist, verifyJWT);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist, verifyJWT);

router.route("/user/:userId").get(getUserPlaylists);

export default router