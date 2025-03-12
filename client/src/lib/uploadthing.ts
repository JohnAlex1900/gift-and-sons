import { generateUploadButton } from "@uploadthing/react";

export const CustomUploadButton = generateUploadButton({
  url: "https://gift-and-sons.vercel.app/api/uploadthing", // Change this to your actual backend URL
});
