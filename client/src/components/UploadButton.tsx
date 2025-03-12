"use client";

import { CustomUploadButton } from "@/lib/uploadthing";
import { toast } from "react-hot-toast";

interface UploadButtonProps {
  setImageUrls: (urls: string[]) => void;
}

export default function UploadButton({ setImageUrls }: UploadButtonProps) {
  return (
    <div className="space-y-2">
      <CustomUploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          if (!res) {
            toast.error("Upload failed");
            return;
          }

          const urls = res.map((file) => file.url);
          setImageUrls(urls);
          toast.success("Images uploaded successfully!");
        }}
        onUploadError={(error) => {
          console.error("Upload error:", error);
          toast.error("Upload failed");
        }}
        appearance={{
          button:
            "bg-primary text-white px-4 py-2 rounded hover:bg-foreground hover:text-primary border border-primary", // ✅ Style the button
          container: "flex flex-col items-center gap-2", // ✅ Style the container
        }}
      />
    </div>
  );
}
