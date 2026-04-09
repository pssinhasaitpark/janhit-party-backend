import cloudinary from "../configs/cloudinaryConfig.js";
import streamifier from "streamifier";
import sharp from "sharp";

export const uploadToCloudinary = (file, folder = "uploads", resourceType) => {
  return new Promise(async (resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    let bufferToUpload = file.buffer;
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    if (isImage) {
      try {
        bufferToUpload = await sharp(file.buffer)
          .resize({ width: 1200 })
          .webp({ quality: 80 })
          .toBuffer();
      } catch (err) {
        return reject(new Error("Image processing failed: " + err.message));
      }
    }

    let typeToUpload = resourceType;
    if (!resourceType) {
      typeToUpload = isImage ? "image" : isVideo ? "video" : "raw";
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: typeToUpload },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );

    streamifier.createReadStream(bufferToUpload).pipe(stream);
  });
};

export const deleteFromCloudinary = async (media) => {
  if (!Array.isArray(media)) return;

  for (const file of media) {
    if (!file.public_id) continue;

    const type =
      file.type === "video" ? "video" : file.type === "raw" ? "raw" : "image";

    await cloudinary.uploader.destroy(file.public_id, { resource_type: type });
  }
};
