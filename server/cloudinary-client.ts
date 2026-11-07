import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { UTApi } from "uploadthing/server";

const getCloudinaryCredentials = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
  apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  return Boolean(cloudName && apiKey && apiSecret);
};

const getCloudinaryClient = () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
};

export const checkCloudinaryConnection = async () => {
  const response = await getCloudinaryClient().api.ping();
  return response.status === "ok";
};

export const uploadCloudinaryImage = (
  file: Express.Multer.File,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const upload = getCloudinaryClient().uploader.upload_stream(
      {
        folder: "gift-and-sons",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary returned no image URL."));
          return;
        }

        resolve(result.secure_url);
      },
    );

    Readable.from([file.buffer]).pipe(upload);
  });

const getCloudinaryPublicId = (url: URL) => {
  const cloudName = getCloudinaryCredentials().cloudName;
  if (!cloudName) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const isStandardCloudinaryHost = url.hostname === "res.cloudinary.com";
  if (isStandardCloudinaryHost && segments[0] !== cloudName) {
    return null;
  }

  if (
    !isStandardCloudinaryHost &&
    url.hostname !== `${cloudName}.res.cloudinary.com`
  ) {
    return null;
  }

  const imageIndex = segments.findIndex((segment) => segment === "image");
  const uploadIndex = imageIndex + 1;
  if (
    imageIndex < 0 ||
    segments[uploadIndex] !== "upload" ||
    (isStandardCloudinaryHost && imageIndex !== 1) ||
    (!isStandardCloudinaryHost && imageIndex !== 0)
  ) {
    return null;
  }

  let publicIdSegments = segments.slice(uploadIndex + 1);
  if (publicIdSegments[0]?.match(/^v\d+$/)) {
    publicIdSegments = publicIdSegments.slice(1);
  }

  const lastSegment = publicIdSegments.at(-1);
  if (!lastSegment || !lastSegment.includes(".")) {
    return null;
  }

  publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(
    /\.[^.]+$/,
    "",
  );
  return publicIdSegments.join("/");
};

const getUploadThingFileKey = (url: URL) => {
  const hostname = url.hostname.toLowerCase();
  const isUploadThingHost =
    hostname === "utfs.io" ||
    hostname === "ufs.sh" ||
    hostname === "uploadthing.com" ||
    hostname.endsWith(".ufs.sh") ||
    hostname.endsWith(".uploadthing.com");

  if (!isUploadThingHost) return null;

  const match = url.pathname.match(/\/f\/([^/]+)\/?$/);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

export const deleteStoredImage = async (imageUrl: string) => {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error("Invalid image URL.");
  }

  const cloudinaryPublicId = getCloudinaryPublicId(url);
  if (cloudinaryPublicId) {
    const response = await getCloudinaryClient().uploader.destroy(
      cloudinaryPublicId,
      { resource_type: "image", invalidate: true },
    );
    if (response.result !== "ok" && response.result !== "not found") {
      throw new Error("Cloudinary did not confirm image deletion.");
    }
    return;
  }

  const uploadThingFileKey = getUploadThingFileKey(url);
  if (uploadThingFileKey) {
    const response = await new UTApi().deleteFiles(uploadThingFileKey);
    if (!response.success) {
      throw new Error("UploadThing did not confirm image deletion.");
    }
    return;
  }

  throw new Error("Image URL is not from a supported image provider.");
};
