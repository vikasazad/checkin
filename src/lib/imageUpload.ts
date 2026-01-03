import { storage } from "@/config/db/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Convert base64 image data to WebP format
 * @param base64Data - The base64 image data
 * @param fileName - Name for the file
 * @returns Promise with the converted WebP file
 */
export const convertBase64ToWebP = (
  base64Data: string,
  fileName: string = "image.jpg"
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxWidth = 800;
      const maxHeight = 800;
      let width = img.width;
      let height = img.height;

      // Resize to maintain aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        } else {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const webpFile = new File(
              [blob],
              fileName.replace(/\.\w+$/, ".webp"),
              {
                type: "image/webp",
              }
            );
            resolve(webpFile);
          } else {
            reject(new Error("Conversion to WebP failed"));
          }
        },
        "image/webp",
        0.8
      );
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for conversion"));
    img.src = base64Data;
  });
};

/**
 * Upload base64 image data to Firebase Storage
 * @param base64Data - The base64 image data
 * @param path - Storage path for the image
 * @param fileName - Name for the file
 * @returns Promise with the download URL or false on error
 */
export const uploadBase64ToFirebase = async (
  base64Data: string,
  path: string,
  fileName: string = "image.jpg"
): Promise<string | false> => {
  try {
    const webpFile = await convertBase64ToWebP(base64Data, fileName);
    const storageRef = ref(storage, `${path}_${webpFile.name}`);
    const snapshot = await uploadBytes(storageRef, webpFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading base64 image:", error);
    return false;
  }
};
