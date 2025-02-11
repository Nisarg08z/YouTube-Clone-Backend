import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;

    const filter = {};

    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filter.owner = new mongoose.Types.ObjectId(userId);
    }

    console.log("Filter used in aggregation:", filter);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
    };

    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "uploader",
                },
            },
            {
                $unwind: {
                    path: "$uploader",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    videoFile: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "uploader.fullName": 1,
                    "uploader.avatar": 1,
                    "uploader.username": 1,
                },
            },
        ]),
        options
    );

    console.log("Fetched Videos:", videos);

    return res
        .status(200)
        .json(new ApiResponse(true, "Videos fetched successfully", videos));
});



const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const uploadvideoFileLocalPath = req.files?.videoFile[0]?.path;
    const uploadThumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!uploadvideoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!uploadThumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(uploadvideoFileLocalPath, { resource_type: 'video' })
    const thumbnail = await uploadOnCloudinary(uploadThumbnailLocalPath)

    console.log("hii", videoFile)

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        owner: req.user.id,
    })

    return res
        .status(201)
        .json(new ApiResponse(true, "Video published successfully", video))
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id; // Get current user ID (if authenticated)

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Check if the user has liked the video
    const userLikeOrNot = userId ? !!(await Like.exists({ video: videoId, likedBy: userId })) : false;

    // Fetch video details using aggregation
    const videoData = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },

        // Lookup uploader details
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "uploader",
            },
        },
        { $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true } },

        // Lookup likes count
        {
            $lookup: {
                from: "likes",
                let: { videoId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
                    { $project: { likedBy: 1 } },
                ],
                as: "likes",
            },
        },

        {
            $addFields: {
                likesCount: { $size: "$likes" },
            },
        },

        // Project final fields
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                "uploader.fullName": 1,
                "uploader.avatar": 1,
                "uploader.username": 1,
                likesCount: 1,
            },
        },
    ]);

    if (!videoData || videoData.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    console.log("User Like Status:", userLikeOrNot);

    const video = { ...videoData[0], isLikedByCurrentUser: userLikeOrNot };

    return res.status(200).json(new ApiResponse(true, "Video fetched successfully", video));
});




const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const { title, description, thumbnail } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: { title, description, thumbnail }
        },
        {
            new: true
        }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(true, "Video updated successfully", updatedVideo))
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(true, "Video deleted successfully"))
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res
        .status(200)
        .json(new ApiResponse(true, "Video publish status updated", video))
})

//Increase Video Views
const increaseViewCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(true, "View count updated", { views: updatedVideo.views }));
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    increaseViewCount
}
