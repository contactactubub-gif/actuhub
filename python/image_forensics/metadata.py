import os
import sys

def extract_exif_metadata(image_path):
    """
    Extract EXIF, camera, date, software metadata from image file.
    Absence of EXIF must never be treated as proof of AI generation.
    """
    if not os.path.exists(image_path):
        return {"found": False, "error": "File not found"}

    try:
        from PIL import Image, ExifTags
        img = Image.open(image_path)
        exif_data = img._getexif()
        
        if not exif_data:
            return {"found": False, "message": "Aucune métadonnée exploitable."}
            
        metadata = {}
        for tag, value in exif_data.items():
            tag_name = ExifTags.TAGS.get(tag, str(tag))
            if tag_name in ['Make', 'Model', 'Software', 'DateTimeOriginal', 'Orientation', 'ColorSpace']:
                metadata[tag_name] = str(value)

        return {
            "found": True,
            "camera": metadata.get('Make', '') + ' ' + metadata.get('Model', ''),
            "software": metadata.get('Software', ''),
            "date_taken": metadata.get('DateTimeOriginal', ''),
            "raw": metadata
        }
    except Exception as e:
        return {"found": False, "error": str(e)}

if __name__ == '__main__':
    if len(sys.argv) > 1:
        res = extract_exif_metadata(sys.argv[1])
        print(res)
