import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary.js";

export async function uploadBuffer(file: Express.Multer.File): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "dr-deepika/consultations",
        resource_type: "auto",
        allowed_formats: ["pdf", "jpg", "jpeg", "png"],
      },
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result);
      },
    );
    stream.end(file.buffer);
  });
}
