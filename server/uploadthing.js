import { createUploadthing } from "uploadthing/express";
var f = createUploadthing(); // ✅ No need to pass secret manually
export var uploadRouter = {
    imageUploader: f({
        image: {
            maxFileSize: "4GB",
            maxFileCount: 50,
        },
    }).onUploadComplete(function (data) {
        console.log("✅ Upload completed:", data);
        console.log("🔗 File URL:", data.file.url);
        console.log("🔑 File Key:", data.file.key);
    }),
};
