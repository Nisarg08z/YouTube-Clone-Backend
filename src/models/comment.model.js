import mongoose , {Schema} from "mongoose"

const commentSchema = new Schema({},{timestamps: true})

export const Comment = mongoose.model("Comment", commentSchema)