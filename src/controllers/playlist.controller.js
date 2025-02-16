import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user.id,
    });

    return res
        .status(201)
        .json(new ApiResponse(true, "Playlist created successfully", playlist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId });

    return res
        .status(200)
        .json(new ApiResponse(true, "User playlists fetched successfully", playlists));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },

        // Lookup owner details
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            },
        },
        { $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true } },

        // Lookup videos and populate uploader details
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
            },
        },

        { $unwind: { path: "$videoDetails", preserveNullAndEmptyArrays: true } },

        // Lookup uploader details
        {
            $lookup: {
                from: "users",
                localField: "videoDetails.owner",
                foreignField: "_id",
                as: "videoDetails.uploader",
            },
        },
        { $unwind: { path: "$videoDetails.uploader", preserveNullAndEmptyArrays: true } },

        // Group videos back into an array
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                description: { $first: "$description" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                owner: {
                    $first: {
                        username: "$ownerDetails.username",
                        fullName: "$ownerDetails.fullName",
                        avatar: "$ownerDetails.avatar",
                    },
                },
                videos: {
                    $push: {
                        _id: "$videoDetails._id",
                        videoFile: "$videoDetails.videoFile",
                        thumbnail: "$videoDetails.thumbnail",
                        title: "$videoDetails.title",
                        description: "$videoDetails.description",
                        duration: "$videoDetails.duration",
                        views: "$videoDetails.views",
                        isPublished: "$videoDetails.isPublished",
                        createdAt: "$videoDetails.createdAt",
                        updatedAt: "$videoDetails.updatedAt",
                        uploader: {
                            username: "$videoDetails.uploader.username",
                            fullName: "$videoDetails.uploader.fullName",
                            avatar: "$videoDetails.uploader.avatar",
                        },
                    },
                },
            },
        },

        // Project only necessary fields
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                videos: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    uploader: 1,
                },
            },
        },
    ]);

    if (!playlist || playlist.length === 0) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(new ApiResponse(true, "Playlist fetched successfully", playlist[0]));
});



const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(true, "Video added to playlist successfully", updatedPlaylist));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    playlist.videos = playlist.videos.filter(id => id.toString() !== videoId);

    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(true, "Video removed from playlist successfully", playlist));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(true, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: { name, description } },
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(true, "Playlist updated successfully", playlist));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
