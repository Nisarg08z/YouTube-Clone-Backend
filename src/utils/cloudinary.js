import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) 
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === "not found") {
            return { message: "Image not found, no deletion needed" };
        }
        if (result.result !== "ok") {
            throw new Error("Failed to delete the image from Cloudinary");
        }
        return { message: "Image deleted successfully" };
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        throw new Error("Error while deleting old Image");
    }
};


export {uploadOnCloudinary, deleteFromCloudinary}