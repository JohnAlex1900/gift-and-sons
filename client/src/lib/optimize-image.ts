const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1440;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const SKIP_OPTIMIZATION_BELOW = 350 * 1024;

const canvasToWebp = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not optimize this image."));
        }
      },
      "image/webp",
      0.82,
    );
  });

export async function optimizeImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `${file.name} is too large to upload in this browser. Use a browser with image optimization support or choose a smaller image.`,
      );
    }

    return file;
  }

  const image = await createImageBitmap(file);

  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_WIDTH / image.width,
      MAX_IMAGE_HEIGHT / image.height,
    );

    if (scale === 1 && file.size <= SKIP_OPTIMIZATION_BELOW) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Image optimization is not supported in this browser.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const optimizedBlob = await canvasToWebp(canvas);

    if (optimizedBlob.size > MAX_FILE_SIZE) {
      if (file.size <= MAX_FILE_SIZE) {
        return file;
      }

      throw new Error(
        `${file.name} is still too large after optimization. Choose a smaller image.`,
      );
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "property-image";
    return new File([optimizedBlob], `${name}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    image.close();
  }
}
