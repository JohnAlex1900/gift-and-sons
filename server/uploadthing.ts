import { createUploadthing, type FileRouter } from "uploadthing/express";

// Ensure UPLOADTHING_SECRET is available
// if (!process.env.UPLOADTHING_SECRET) {
//   throw new Error("❌ Missing UPLOADTHING_SECRET in environment variables.");
// }

const f = createUploadthing(); // ✅ No need to pass secret manually

export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4GB",
      maxFileCount: 50,
    },
  }).onUploadComplete((data) => {
    console.log("✅ Upload completed:", data);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
