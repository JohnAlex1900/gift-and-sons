import { generateUploadButton } from "@uploadthing/react";
import { apiUrl } from "@/api";

export const CustomUploadButton = generateUploadButton({
  url: apiUrl("/api/uploadthing"),
});
