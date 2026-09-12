import os
import sys
import json
from ela import perform_ela
from metadata import extract_exif_metadata
from hashing import compute_hashes
from ai_detector import LocalAIImageDetector, HuggingFaceLocalDetector
from c2pa import verify_c2pa_provenance

def run_full_analysis(image_path):
    """
    Main orchestration entry point for the Python Image Forensics Service.
    """
    if not os.path.exists(image_path):
        return json.dumps({"error": "File not found"})

    ela_res = perform_ela(image_path)
    meta_res = extract_exif_metadata(image_path)
    hash_res = compute_hashes(image_path)
    c2pa_res = verify_c2pa_provenance(image_path)

    # AI Detection
    hf_detector = HuggingFaceLocalDetector()
    ai_res = hf_detector.analyze_image(image_path)

    report = {
        "status": "completed",
        "hashes": hash_res,
        "metadata": meta_res,
        "forensics": ela_res,
        "c2pa": c2pa_res,
        "ai_analysis": ai_res
    }
    return json.dumps(report, ensure_ascii=False)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        print(run_full_analysis(sys.argv[1]))
    else:
        print(json.dumps({"error": "No image path provided"}))
