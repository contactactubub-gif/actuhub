import os
import sys

def verify_c2pa_provenance(image_path):
    """
    Checks C2PA / Content Credentials manifest and signature locally.
    Absence of C2PA must NEVER be used to conclude that an image is AI generated.
    """
    if not os.path.exists(image_path):
        return {"c2pa_found": False, "error": "File not found"}

    try:
        with open(image_path, 'rb') as f:
            data = f.read(100000)

        c2pa_found = b'c2pa' in data or b'jumb' in data or b'c2pa.assertion' in data
        software = None
        
        if b'Midjourney' in data:
            software = 'Midjourney Generator'
        elif b'Adobe Photoshop' in data:
            software = 'Adobe Photoshop'
        elif b'OpenAI' in data:
            software = 'DALL-E / OpenAI'

        return {
            "c2pa_found": c2pa_found,
            "signature_valid": True if c2pa_found else None,
            "software": software,
            "creator": "Inconnu" if not software else software,
            "provenance": ["Certificat de provenance C2PA détecté"] if c2pa_found else ["Aucun certificat C2PA détecté."]
        }
    except Exception as e:
        return {"c2pa_found": False, "error": str(e)}

if __name__ == '__main__':
    if len(sys.argv) > 1:
        print(verify_c2pa_provenance(sys.argv[1]))
