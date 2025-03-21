import { createUploadthing, type FileRouter } from "uploadthing/express";

// Define the correct type for the `data` parameter
type UploadCompleteData = {
  metadata: undefined; // Adjust this type based on your actual metadata
  file: {
    ufsUrl: string;
    key: string;
  };
};

const f = createUploadthing(); // ✅ No need to pass secret manually

export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4GB",
      maxFileCount: 50,
    },
  }).onUploadComplete((data: UploadCompleteData) => {
    console.log("✅ Upload completed:", data);
    console.log("🔗 File URL:", data.file.ufsUrl);
    console.log("🔑 File Key:", data.file.key);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
