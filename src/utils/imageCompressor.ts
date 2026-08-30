/**
 * Utility to compress image files client-side before storing or uploading.
 * This resizes high-resolution photos (from phones/cameras) to a web-optimized max dimension (default 1200px)
 * and compresses them to JPEG data URLs (~80KB - 250KB max), well within Firestore's 1MB limit per document.
 */
export function compressImageFile(
  file: File, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Aucun fichier fourni."));
      return;
    }

    // Robust fallback to raw data URL if canvas compression or initial reader fails
    const fallbackToRaw = () => {
      try {
        const rawReader = new FileReader();
        rawReader.onerror = () => {
          reject(new Error("Erreur de lecture de l'image."));
        };
        rawReader.onload = (ev) => {
          if (ev.target?.result) {
            resolve(ev.target.result as string);
          } else {
            reject(new Error("Erreur de lecture de l'image."));
          }
        };
        rawReader.readAsDataURL(file);
      } catch (e) {
        reject(new Error("Erreur de lecture de l'image."));
      }
    };

    // If it's a video or non-image file, use standard reader
    if (!file.type.startsWith('image/')) {
      fallbackToRaw();
      return;
    }

    try {
      const reader = new FileReader();
      reader.onerror = () => {
        console.warn("FileReader error on image, trying raw fallback");
        fallbackToRaw();
      };
      reader.onload = (e) => {
        try {
          const img = new Image();
          img.onerror = () => {
            console.warn("Image loading error, trying raw fallback");
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              fallbackToRaw();
            }
          };
          img.onload = () => {
            try {
              let width = img.width;
              let height = img.height;

              // Scale dimensions proportionally
              if (width > maxWidth || height > maxHeight) {
                if (width / height > maxWidth / maxHeight) {
                  height = Math.round((height * maxWidth) / width);
                  width = maxWidth;
                } else {
                  width = Math.round((width * maxHeight) / height);
                  height = maxHeight;
                }
              }

              const canvas = document.createElement('canvas');
              canvas.width = Math.max(1, width);
              canvas.height = Math.max(1, height);
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                if (e.target?.result) {
                  resolve(e.target.result as string);
                } else {
                  fallbackToRaw();
                }
                return;
              }

              // Fill white background (useful if transparent PNG is converted to JPEG)
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              // Always compress as image/jpeg for optimal web size unless original is small
              const mimeType = file.type === 'image/gif' ? 'image/gif' : 'image/jpeg';
              const compressedDataUrl = canvas.toDataURL(mimeType, quality);
              
              resolve(compressedDataUrl);
            } catch (err) {
              console.warn("Canvas compression failed, falling back to raw data URL:", err);
              if (e.target?.result) {
                resolve(e.target.result as string);
              } else {
                fallbackToRaw();
              }
            }
          };
          img.src = e.target?.result as string;
        } catch (innerErr) {
          console.warn("Error inside reader.onload, trying raw fallback:", innerErr);
          fallbackToRaw();
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Error starting FileReader, trying raw fallback:", err);
      fallbackToRaw();
    }
  });
}
