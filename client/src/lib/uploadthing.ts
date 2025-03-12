import { generateUploadButton } from "@uploadthing/react";

export const CustomUploadButton = generateUploadButton({
  url: "http://localhost:5000/api/uploadthing", // Change this to your actual backend URL
});
