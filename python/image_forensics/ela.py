import os
import sys
from PIL import Image, ImageChops, ImageEnhance

def perform_ela(image_path, quality=90, scale=15):
    """
    Error Level Analysis (ELA) implementation using Pillow.
    Saves a temporary recompressed image and measures the pixel difference.
    Note: ELA is an indicator, never definitive proof of manipulation.
    """
    if not os.path.exists(image_path):
        return {"ela_score": 0, "error": "File not found"}

    try:
        tmp_path = image_path + ".tmp_ela.jpg"
        original = Image.open(image_path).convert('RGB')
        
        # Save recompressed version
        original.save(tmp_path, 'JPEG', quality=quality)
        recompressed = Image.open(tmp_path)
        
        # Calculate difference
        ela_im = ImageChops.difference(original, recompressed)
        
        # Extrema
        extrema = ela_im.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        if max_diff == 0:
            max_diff = 1
        
        scale_factor = 255.0 / max_diff
        ela_im = ImageEnhance.Brightness(ela_im).enhance(scale_factor)
        
        # Calculate mean error score (0 to 100)
        stat = ela_im.histogram()
        avg_diff = sum(i * stat[i] for i in range(len(stat))) / (original.size[0] * original.size[1])
        ela_score = min(100, max(0, int((avg_diff / 255.0) * 100 * 3)))
        
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            
        return {
            "ela_score": ela_score,
            "max_difference": max_diff,
            "confidence": "medium"
        }
    except Exception as e:
        return {
            "ela_score": 0,
            "error": str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) > 1:
        res = perform_ela(sys.argv[1])
        print(res)
