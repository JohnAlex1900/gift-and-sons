"use client";

import { CustomUploadButton } from "@/lib/uploadthing";
import { optimizeImage } from "@/lib/optimize-image";
import { toast } from "react-hot-toast";
import React from "react";

interface UploadButtonProps {
  setImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function UploadButton({ setImageUrls }: UploadButtonProps) {
  return (
    <div className="space-y-2">
      <CustomUploadButton
        endpoint="imageUploader"
        onBeforeUploadBegin={async (files) => {
          const optimizedFiles: File[] = [];
          for (const file of files) {
            optimizedFiles.push(await optimizeImage(file));
          }
          return optimizedFiles;
        }}
        onClientUploadComplete={(res) => {
          if (!res) {
            toast.error("Upload failed");
            return;
          }

          const urls = res.map((file) => file.ufsUrl);
          setImageUrls((currentUrls) => [...currentUrls, ...urls]);
          toast.success("Images uploaded successfully!");
        }}
        onUploadError={(error) => {
          console.error("Upload error:", error);
          toast.error(error.message || "Upload failed");
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
