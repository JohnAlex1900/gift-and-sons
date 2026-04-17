import { createUploadthing } from "uploadthing/express";
const f = createUploadthing(); // ✅ No need to pass secret manually
export const uploadRouter = {
    imageUploader: f({
        image: {
            maxFileSize: "4GB",
            maxFileCount: 50,
        },
    }).onUploadComplete((data) => {
        console.log("✅ Upload completed:", data);
        console.log("🔗 File URL:", data.file.ufsUrl);
        console.log("🔑 File Key:", data.file.key);
    }),
};
