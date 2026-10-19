const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 900;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const resizeImageForStorage = async (file) => {
  if (!file || !SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, or GIF image.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Choose an image smaller than 8 MB.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("This browser could not process the selected image.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const imageBlob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.78);
  });

  if (!imageBlob) {
    throw new Error("The selected image could not be processed.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("The selected image could not be read."));
      }
    };
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(imageBlob);
  });
};
