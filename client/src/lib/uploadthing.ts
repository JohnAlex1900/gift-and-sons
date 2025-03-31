import { generateUploadButton } from "@uploadthing/react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const CustomUploadButton = generateUploadButton({
  url: `${API_BASE_URL}/api/uploadthing`, //"https://gift-and-sons.onrender.com/api/uploadthing", // Change this to your actual backend URL
});
