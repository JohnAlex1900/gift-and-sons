import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/api";
import { auth } from "@/lib/firebase";
import { optimizeImage } from "@/lib/optimize-image";
import { toast } from "react-hot-toast";

const MAX_UPLOAD_COUNT = 20;

interface UploadButtonProps {
  setImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function UploadButton({ setImageUrls }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadingIndex, setUploadingIndex] = useState(0);

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) return;
    if (selectedFiles.length > MAX_UPLOAD_COUNT) {
      toast.error(`Select no more than ${MAX_UPLOAD_COUNT} images at a time.`);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error("Sign in as an admin before uploading images.");
      return;
    }

    setUploadingCount(selectedFiles.length);
    setUploadingIndex(0);
    const failures: string[] = [];
    let uploadedCount = 0;

    try {
      const token = await user.getIdToken(true);
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const originalFile = selectedFiles[index];
        setUploadingIndex(index + 1);
        try {
          const file = await optimizeImage(originalFile);
          const formData = new FormData();
          formData.append("image", file);

          const response = await fetch(apiUrl("/api/admin/images/upload"), {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const result = (await response.json()) as {
            url?: string;
            message?: string;
          };

          if (!response.ok || !result.url) {
            throw new Error(result.message || "Image upload failed.");
          }

          const uploadedUrl = result.url;
          setImageUrls((currentUrls) => [...currentUrls, uploadedUrl]);
          uploadedCount += 1;
        } catch (error) {
          failures.push(
            `${originalFile.name}: ${
              error instanceof Error ? error.message : "Upload failed."
            }`,
          );
        }
      }

      if (uploadedCount > 0) {
        toast.success(
          `${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded to Cloudinary.`,
        );
      }
      if (failures.length > 0) {
        toast.error(
          `${failures.length} image${failures.length === 1 ? "" : "s"} failed. ${failures[0]}`,
          { duration: 6000 },
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload images.",
      );
    } finally {
      setUploadingCount(0);
      setUploadingIndex(0);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={handleFilesSelected}
        disabled={uploadingCount > 0}
      />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploadingCount > 0}
        className="bg-primary text-primary-foreground"
      >
        {uploadingCount > 0
          ? `Uploading ${uploadingIndex} of ${uploadingCount}…`
          : "Upload images"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Images are optimized and uploaded to Cloudinary. Select up to 20 JPEG,
        PNG, or WebP images.
      </p>
    </div>
  );
}
