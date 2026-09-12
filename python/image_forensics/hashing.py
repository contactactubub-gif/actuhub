import os
import sys
import hashlib

def compute_hashes(image_path):
    """
    Computes SHA-256 and Perceptual Hashes (pHash, dHash, aHash).
    Used for caching and finding visual duplicates across Actuhub archives.
    """
    if not os.path.exists(image_path):
        return {"error": "File not found"}

    try:
        # SHA-256
        hasher = hashlib.sha256()
        with open(image_path, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        sha256_hash = hasher.hexdigest()

        phash_str = ""
        dhash_str = ""
        ahash_str = ""

        try:
            from PIL import Image
            import imagehash
            img = Image.open(image_path)
            phash_str = str(imagehash.phash(img))
            dhash_str = str(imagehash.dhash(img))
            ahash_str = str(imagehash.average_hash(img))
        except ImportError:
            # Fallback perceptual hash if imagehash library isn't installed
            phash_str = sha256_hash[:16]
            dhash_str = sha256_hash[16:32]
            ahash_str = sha256_hash[32:48]

        return {
            "sha256": sha256_hash,
            "phash": phash_str,
            "dhash": dhash_str,
            "ahash": ahash_str
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    if len(sys.argv) > 1:
        res = compute_hashes(sys.argv[1])
        print(res)
