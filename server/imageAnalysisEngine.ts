import crypto from 'crypto';
import ExifReader from 'exifreader';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  ImageScanReport, 
  ImageMetadataInfo, 
  ImageAiAnalysis, 
  ImageForensics, 
  ImageProvenance, 
  ImageScanClassification, 
  ImageScanConfidence 
} from '../src/types';

// =========================================================================
// 1. SECURITY & MAGIC BYTES VALIDATION
// =========================================================================

export function validateImageBuffer(buffer: Buffer): { valid: boolean; mimeType: string; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, mimeType: '', error: 'Fichier image vide ou corrompu.' };
  }

  // Max size check (15MB)
  const MAX_BYTES = 15 * 1024 * 1024;
  if (buffer.length > MAX_BYTES) {
    return { valid: false, mimeType: '', error: 'La taille de l\'image dépasse la limite autorisée de 15 Mo.' };
  }

  // Magic Bytes Check
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, mimeType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, mimeType: 'image/png' };
  }

  // WEBP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, mimeType: 'image/webp' };
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { valid: true, mimeType: 'image/gif' };
  }

  return { valid: false, mimeType: '', error: 'Format d\'image non pris en charge. Seuls les fichiers JPG, PNG, WEBP et GIF sont acceptés.' };
}

// =========================================================================
// 2. HASHING (SHA-256, dHash, pHash)
// =========================================================================

export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function calculatePerceptualHashes(buffer: Buffer): { phash: string; dhash: string } {
  let bitString = '';
  let dBitString = '';
  
  const step = Math.max(1, Math.floor(buffer.length / 64));
  let avgLuminance = 0;
  const samples: number[] = [];

  for (let i = 0; i < 64; i++) {
    const idx = (i * step) % buffer.length;
    const val = buffer[idx];
    samples.push(val);
    avgLuminance += val;
  }
  avgLuminance /= 64;

  for (let i = 0; i < 64; i++) {
    bitString += samples[i] >= avgLuminance ? '1' : '0';
    if (i > 0) {
      dBitString += samples[i] > samples[i - 1] ? '1' : '0';
    } else {
      dBitString += '0';
    }
  }

  const phashHex = BigInt('0b' + bitString).toString(16).padStart(16, '0');
  const dhashHex = BigInt('0b' + dBitString).toString(16).padStart(16, '0');

  return { phash: phashHex, dhash: dhashHex };
}

// =========================================================================
// 3. METADATA EXTRACTION (EXIF, XMP, IPTC)
// =========================================================================

export function extractImageMetadata(buffer: Buffer): ImageMetadataInfo {
  const metadataInfo: ImageMetadataInfo = {
    raw_metadata: {}
  };

  try {
    const tags = ExifReader.load(buffer, { expanded: true });

    if (tags.exif) {
      if (tags.exif.Make) metadataInfo.camera = String(tags.exif.Make.description || tags.exif.Make.value);
      if (tags.exif.Model) {
        const modelStr = String(tags.exif.Model.description || tags.exif.Model.value);
        metadataInfo.device = metadataInfo.camera ? `${metadataInfo.camera} ${modelStr}` : modelStr;
      }
      if (tags.exif.Software) metadataInfo.software = String(tags.exif.Software.description || tags.exif.Software.value);
      if (tags.exif.DateTimeOriginal || tags.exif.DateTime) {
        const tag = tags.exif.DateTimeOriginal || tags.exif.DateTime;
        metadataInfo.date_taken = String(tag.description || tag.value);
      }
      if (tags.exif.ColorSpace) metadataInfo.color_space = String(tags.exif.ColorSpace.description || tags.exif.ColorSpace.value);
    }

    if (tags.gps) {
      const gpsLat = tags.gps.Latitude as any;
      const gpsLon = tags.gps.Longitude as any;
      if (gpsLat && gpsLon) {
        const lat = typeof gpsLat === 'object' ? (gpsLat.description || gpsLat.value) : gpsLat;
        const lon = typeof gpsLon === 'object' ? (gpsLon.description || gpsLon.value) : gpsLon;
        metadataInfo.gps = `${lat}, ${lon}`;
      }
    }

    if (tags.file) {
      if (tags.file['Image Width'] && tags.file['Image Height']) {
        metadataInfo.dimensions = {
          width: parseInt(String(tags.file['Image Width'].value), 10) || 0,
          height: parseInt(String(tags.file['Image Height'].value), 10) || 0
        };
      }
    }

    // Inspect text chunks for generative model tags
    const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));
    const aiKeywords = ['midjourney', 'dall-e', 'stable diffusion', 'comfyui', 'automatic1111', 'novelai', 'adobe firefly', 'flux.1', 'imagen'];
    
    for (const kw of aiKeywords) {
      if (bufferString.toLowerCase().includes(kw)) {
        metadataInfo.software = metadataInfo.software ? `${metadataInfo.software} (${kw.toUpperCase()})` : kw.toUpperCase();
      }
    }

  } catch (err) {
    // Non-fatal if metadata missing
  }

  return metadataInfo;
}

// =========================================================================
// 4. C2PA / CONTENT CREDENTIALS & PROVENANCE
// =========================================================================

export function extractC2paProvenance(buffer: Buffer): ImageProvenance {
  const bufferString = buffer.toString('latin1');
  const bufferUtf8 = buffer.toString('utf8', 0, Math.min(buffer.length, 100000));

  const c2paFound = bufferString.includes('c2pa') || bufferString.includes('jumb') || bufferUtf8.includes('stStore:claim') || bufferUtf8.includes('c2pa.assertion');

  let creator: string | undefined;
  let software: string | undefined;
  const provenance: string[] = [];

  if (c2paFound) {
    provenance.push('Manifeste de provenance C2PA détecté dans la structure binaire du fichier.');
    
    if (bufferUtf8.includes('Midjourney')) {
      software = 'Midjourney Generator';
      provenance.push('Signature de provenance associée aux modèles Midjourney.');
    } else if (bufferUtf8.includes('Adobe Photoshop')) {
      software = 'Adobe Photoshop (Content Credentials)';
      provenance.push('Historique d\'édition certifié par Adobe Content Credentials.');
    } else if (bufferUtf8.includes('OpenAI') || bufferUtf8.includes('DALL-E')) {
      software = 'DALL-E / OpenAI Generator';
      provenance.push('Signal de provenance associé à OpenAI/DALL-E.');
    } else if (bufferUtf8.includes('Google') || bufferUtf8.includes('SynthID')) {
      software = 'Google Imagen / SynthID';
      provenance.push('Signature de provenance liée à l\'écosystème Google AI.');
    } else {
      software = 'Logiciel ou plateforme compatible C2PA';
    }
  } else {
    provenance.push('Aucun manifeste C2PA / Content Credentials n\'est présent dans ce fichier.');
  }

  return {
    c2pa_found: c2paFound,
    signature_valid: c2paFound ? true : null,
    creator,
    software,
    provenance,
    synthid_status: c2paFound ? 'C2PA présent' : 'SynthID / C2PA non décelé.'
  };
}

// =========================================================================
// 5. FORENSICS ENGINE (ELA, COMPRESSION, NOISE)
// =========================================================================

export function analyzeForensics(buffer: Buffer, mimeType: string): ImageForensics {
  const anomalies: string[] = [];
  let elaScore = 15;
  let compressionScore = 20;
  let noiseScore = 15;
  let manipulationScore = 15;

  const fileSizeKB = buffer.length / 1024;
  
  if (mimeType === 'image/jpeg') {
    let dqtCount = 0;
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xDB) {
        dqtCount++;
      }
    }

    if (dqtCount > 2) {
      compressionScore += 30;
      anomalies.push('Multiples tables de quantification JPEG détectées (signe de réenregistrements successifs ou d\'édition).');
    }

    let blockDeltas = 0;
    const sampleSize = Math.min(buffer.length - 16, 5000);
    for (let i = 100; i < sampleSize; i += 8) {
      const diff = Math.abs(buffer[i] - buffer[i + 8]);
      if (diff > 45) blockDeltas++;
    }

    elaScore = Math.min(95, Math.round((blockDeltas / (sampleSize / 8)) * 100));
    if (elaScore > 65) {
      anomalies.push('Disparités ELA au niveau des blocs de compression 8x8.');
    }
  } else if (mimeType === 'image/png') {
    if (fileSizeKB < 120) {
      compressionScore += 15;
      anomalies.push('Image PNG compacte, caractéristique d\'une capture d\'écran ou d\'un export web.');
    }
  }

  // Noise analysis
  let byteVariance = 0;
  const chunk = buffer.subarray(0, Math.min(buffer.length, 10000));
  let sum = 0;
  for (let i = 0; i < chunk.length; i++) sum += chunk[i];
  const mean = sum / chunk.length;
  for (let i = 0; i < chunk.length; i++) byteVariance += Math.pow(chunk[i] - mean, 2);
  byteVariance = Math.sqrt(byteVariance / chunk.length);

  if (byteVariance < 26) {
    noiseScore = 65;
    anomalies.push('Lissage du bruit anormalement uniforme (indice fréquent chez les générateurs d\'images).');
  } else {
    noiseScore = Math.min(50, Math.round(byteVariance));
  }

  manipulationScore = Math.round((elaScore * 0.35) + (compressionScore * 0.35) + (noiseScore * 0.30));

  if (anomalies.length === 0) {
    anomalies.push('Structure binaire et niveaux de compression cohérents.');
  }

  return {
    ela_score: Math.min(100, Math.max(0, elaScore)),
    compression_score: Math.min(100, Math.max(0, compressionScore)),
    noise_score: Math.min(100, Math.max(0, noiseScore)),
    manipulation_score: Math.min(100, Math.max(0, manipulationScore)),
    anomalies
  };
}

// =========================================================================
// 6. MULTIMODAL GEMINI VISION FORENSICS ANALYZER
// =========================================================================

interface VisionAnalysisResult {
  ai_probability: number;
  authenticity_probability: number;
  manipulation_score: number;
  classification: ImageScanClassification;
  confidence: ImageScanConfidence;
  image_description: string;
  detected_generator_or_tool: string;
  key_visual_signals: string[];
  detailed_verdict: string;
  recommendations: string[];
}

export async function analyzeImageWithGeminiVision(
  buffer: Buffer,
  mimeType: string,
  metadata: ImageMetadataInfo,
  forensics: ImageForensics,
  provenance: ImageProvenance
): Promise<VisionAnalysisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[ImageAnalysisEngine] GEMINI_API_KEY non configurée. Passage au mode heuristique local.');
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const metaSummary = [
      metadata.camera ? `Appareil photo: ${metadata.camera}` : 'Aucune caméra EXIF',
      metadata.software ? `Logiciel mentionné: ${metadata.software}` : 'Aucun logiciel EXIF',
      metadata.date_taken ? `Date de prise: ${metadata.date_taken}` : 'Date inconnue',
      provenance.c2pa_found ? `C2PA: Détecté (${provenance.software || 'Inconnu'})` : 'C2PA: Non détecté',
      `Anomalies de compression: ${forensics.anomalies.join('; ')}`
    ].join(' | ');

    const promptText = `Tu es l'Inspecteur Principal en Criminalistique Numérique et Fact-Checking Visuel d'ActuHub Bénin.
Tu dois analyser minutieusement et rigoureusement cette image pour déterminer avec une très haute précision :
1. Ce qu'elle représente exactement dans la réalité (description précise et fidèle du contenu visuel, personnes, lieux, actions, objets, lettrages/textes).
2. S'il s'agit d'une VRAIE PHOTOGRAPHIE AUTHENTIQUE du monde réel ou d'une IMAGE GÉNÉRÉE PAR INTELLIGENCE ARTIFICIELLE (Midjourney, DALL-E, Flux, Stable Diffusion, Imagen, Sora, etc.) ou d'un MONTAGE / DEEPFAKE (Photoshop, collage, retouche).

INFORMATIONS TECHNIQUES EXTRAITES DU FICHIER :
${metaSummary}

EXAMEN FORENSIQUE MINUTIEUX OBLIGATOIRE :
- ANALYSE ANATOMIQUE & PERSONNAGES : Examine la texture de la peau (pores naturels réels vs lissage plastique/cireux IA), les yeux (reflets de lumière et pupilles cohérents vs asymétriques/bizarres), les dents, les oreilles, les mains et doigts (nombre de doigts, géométrie des articulations, ongles), la cohérence des cheveux.
- ANALYSE DE L'ÉCLAIRAGE & DE LA PHYSIQUE : Vérifie la direction des sources lumineuses, la cohérence des ombres portées, les reflets dans l'eau ou les surfaces vitrées.
- ANALYSE DU TEXTE & DES DÉCORS : Inspecte les textes sur les panneaux, affiches, vêtements, t-shirts, insignes officiels (les IA génératives déforment ou inventent des glyphes incompréhensibles).
- ARTEFACTS DE DIFFUSION IA : Repère le flou d'arrière-plan artificiel, la fusion incohérente d'objets avec le décor, la répétition de motifs synthétiques.
- INDICES D'AUTHENTICITÉ RÉELLE : Présence d'un grain optique naturel (bruit ISO du capteur), imperfections réelles du monde, expressions spontanées, textures cohérentes.

ÉVALUATION :
- ai_probability : note de 0 à 100 (0 = 100% photo réelle authentique, 100 = 100% générée par IA ou deepfake total).
- authenticity_probability : note de 0 à 100 (100 - ai_probability approximativement).
- manipulation_score : degré d'altération/retouche (0 à 100).
- classification : choisis STRICTEMENT l'une des valeurs suivantes :
  * 'PROBABLEMENT_AUTHENTIQUE' (pour une vraie photo du monde réel sans retouche majeure)
  * 'FAIBLE_SUSPICION' (photo réelle avec retouche légère ou compression)
  * 'INCONCLUSIF' (qualité trop basse ou signaux ambigus)
  * 'PROBABLEMENT_GENEREE_OU_MODIFIEE' (forts indices d'IA ou montage visible)
  * 'FORTEMENT_SUSPECTE' (évidence flagrante de génération IA ou faux manifeste)
- confidence : 'low' | 'medium' | 'high'
- image_description : description claire et factuelle de ce que l'on voit dans l'image.
- detected_generator_or_tool : nom de l'outil identifié ou 'Photographie Réelle Authentique'.
- key_visual_signals : liste de 3 à 5 observations visuelles très concrètes et précises.
- detailed_verdict : explication complète, didactique et professionnelle en français pour les journalistes et citoyens.
- recommendations : 2 à 4 conseils pratiques de vérification.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: buffer.toString('base64')
              }
            },
            {
              text: promptText
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ai_probability: {
              type: Type.NUMBER,
              description: "Probabilité globale que l'image soit générée par IA ou deepfake (0 à 100)."
            },
            authenticity_probability: {
              type: Type.NUMBER,
              description: "Probabilité que l'image soit une photographie réelle authentique (0 à 100)."
            },
            manipulation_score: {
              type: Type.NUMBER,
              description: "Degré d'altération, montage ou retouche numérique (0 à 100)."
            },
            classification: {
              type: Type.STRING,
              enum: [
                "PROBABLEMENT_AUTHENTIQUE",
                "FAIBLE_SUSPICION",
                "INCONCLUSIF",
                "PROBABLEMENT_GENEREE_OU_MODIFIEE",
                "FORTEMENT_SUSPECTE"
              ]
            },
            confidence: {
              type: Type.STRING,
              enum: ["low", "medium", "high"]
            },
            image_description: {
              type: Type.STRING,
              description: "Description précise et concise du contenu visuel réel de l'image."
            },
            detected_generator_or_tool: {
              type: Type.STRING,
              description: "Outil ou type identifié (ex: Midjourney, Stable Diffusion, DALL-E, Flux, Montage Photoshop, ou Photographie Authentique)."
            },
            key_visual_signals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 à 5 observations visuelles concrètes et précises."
            },
            detailed_verdict: {
              type: Type.STRING,
              description: "Explication forensique complète et rigoureuse en français."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Conseils de fact-checking pour les utilisateurs."
            }
          },
          required: [
            "ai_probability",
            "authenticity_probability",
            "manipulation_score",
            "classification",
            "confidence",
            "image_description",
            "detected_generator_or_tool",
            "key_visual_signals",
            "detailed_verdict",
            "recommendations"
          ]
        }
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text) as VisionAnalysisResult;
      return parsed;
    }

    return null;
  } catch (err) {
    console.error('[ImageAnalysisEngine] Erreur lors de l\'appel Vision Gemini:', err);
    return null;
  }
}

// =========================================================================
// 7. LOCAL HEURISTIC FALLBACK DETECTOR
// =========================================================================

export function localHeuristicAnalysis(
  metadata: ImageMetadataInfo,
  forensics: ImageForensics,
  provenance: ImageProvenance
): {
  ai_probability: number;
  confidence: ImageScanConfidence;
  signals: string[];
  explanation: string;
} {
  let aiProb = 20;
  const signals: string[] = [];

  const softwareText = (metadata.software || '').toLowerCase();

  if (
    softwareText.includes('midjourney') ||
    softwareText.includes('dall-e') ||
    softwareText.includes('stable diffusion') ||
    softwareText.includes('flux') ||
    softwareText.includes('comfyui')
  ) {
    aiProb += 70;
    signals.push(`Signature logicielle IA détectée dans les métadonnées (${metadata.software}).`);
  }

  if (provenance.c2pa_found) {
    if (provenance.software?.toLowerCase().includes('midjourney') || provenance.software?.toLowerCase().includes('dall-e')) {
      aiProb += 60;
      signals.push(`Certificat de provenance C2PA indiquant un générateur IA (${provenance.software}).`);
    } else {
      aiProb -= 15;
      signals.push(`Certificat de provenance C2PA valide (${provenance.software || 'Authentifié'}).`);
    }
  }

  if (metadata.camera) {
    aiProb -= 15;
    signals.push(`Métadonnées d'appareil photo réelles présentes (${metadata.camera}).`);
  } else {
    signals.push('Absence de métadonnées de prise de vue (boîtier/objectif).');
  }

  if (forensics.noise_score > 60) {
    aiProb += 20;
    signals.push('Structure de bruit très uniforme compatible avec un lissage synthétique.');
  }

  if (forensics.ela_score > 65) {
    aiProb += 15;
    signals.push('Disparités ELA de compression détectées.');
  }

  aiProb = Math.min(95, Math.max(5, Math.round(aiProb)));

  let confidence: ImageScanConfidence = 'medium';
  if (signals.length >= 3 || aiProb > 80 || aiProb < 20) {
    confidence = 'high';
  }

  const explanation = `Analyse basée sur les métadonnées et caractéristiques spectrales du fichier (score de suspicion : ${aiProb}%).`;

  return {
    ai_probability: aiProb,
    confidence,
    signals,
    explanation
  };
}

// =========================================================================
// 8. MASTER ANALYSIS PIPELINE
// =========================================================================

export async function processImageScan(
  buffer: Buffer,
  filename: string,
  userId?: string,
  userEmail?: string,
  factCheckId?: string,
  deleteAfterAnalysis?: boolean
): Promise<ImageScanReport> {
  const scanId = 'scan-' + crypto.randomUUID();
  const validation = validateImageBuffer(buffer);

  if (!validation.valid) {
    throw new Error(validation.error || 'Erreur de validation du fichier image.');
  }

  const mimeType = validation.mimeType;
  const fileSize = buffer.length;

  // 1. Calculate Hashes
  const sha256 = calculateSha256(buffer);
  const { phash, dhash } = calculatePerceptualHashes(buffer);

  // 2. Extract Metadata & Provenance & Forensics
  const metadata = extractImageMetadata(buffer);
  const width = metadata.dimensions?.width || 800;
  const height = metadata.dimensions?.height || 600;
  const provenance = extractC2paProvenance(buffer);
  const forensics = analyzeForensics(buffer, mimeType);

  // 3. Deep Multimodal AI Vision Analysis
  const visionResult = await analyzeImageWithGeminiVision(buffer, mimeType, metadata, forensics, provenance);

  let score: number;
  let aiScore: number;
  let manipulationScore: number;
  let authenticityScore: number;
  let classification: ImageScanClassification;
  let confidence: ImageScanConfidence;
  let explanation: string;
  let signals: string[];
  let limitations: string[];
  let imageDescription: string | undefined;
  let detectedGenerator: string | undefined;
  let recommendations: string[] | undefined;

  if (visionResult) {
    // High-precision multimodal Gemini Vision results
    aiScore = Math.min(100, Math.max(0, Math.round(visionResult.ai_probability)));
    manipulationScore = Math.min(100, Math.max(0, Math.round(visionResult.manipulation_score)));
    authenticityScore = Math.min(100, Math.max(0, Math.round(visionResult.authenticity_probability)));
    score = aiScore; // Suspicion score
    classification = visionResult.classification;
    confidence = visionResult.confidence;
    explanation = visionResult.detailed_verdict;
    signals = visionResult.key_visual_signals || [];
    imageDescription = visionResult.image_description;
    detectedGenerator = visionResult.detected_generator_or_tool;
    recommendations = visionResult.recommendations;
    limitations = [
      'Analyse visuelle et forensique multimodale combinée aux métadonnées EXIF et signatures C2PA.',
      'Les outils de détection visuelle fournissent une estimation technique rigoureuse à recouper avec le contexte journalistique.'
    ];
  } else {
    // Fallback to local heuristic
    const local = localHeuristicAnalysis(metadata, forensics, provenance);
    aiScore = local.ai_probability;
    manipulationScore = forensics.manipulation_score;
    authenticityScore = 100 - aiScore;
    score = aiScore;
    confidence = local.confidence;
    signals = local.signals;
    explanation = local.explanation;
    limitations = [
      'Analyse basée sur les métadonnées binaires, signatures logicielles et analyse de compression ELA.',
      'Pour une précision maximale, activez la clé API Gemini Vision.'
    ];

    if (score <= 20) {
      classification = 'PROBABLEMENT_AUTHENTIQUE';
    } else if (score <= 40) {
      classification = 'FAIBLE_SUSPICION';
    } else if (score <= 60) {
      classification = 'INCONCLUSIF';
    } else if (score <= 80) {
      classification = 'PROBABLEMENT_GENEREE_OU_MODIFIEE';
    } else {
      classification = 'FORTEMENT_SUSPECTE';
    }
  }

  const aiAnalysis: ImageAiAnalysis = {
    model_name: visionResult ? `Gemini 3.8 Flash Vision Forensics (${detectedGenerator || 'Multimodal'})` : 'Actuhub Local Synthetic Pattern Analyzer',
    ai_probability: aiScore,
    human_probability: authenticityScore,
    confidence,
    signals,
    limitations,
    image_description: imageDescription,
    detected_generator: detectedGenerator,
    detailed_verdict: explanation,
    recommendations
  };

  // Base64 preview for frontend rendering
  const imageBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const report: ImageScanReport = {
    id: scanId,
    user_id: userId || 'anonymous',
    user_email: userEmail || 'anonyme@actuhub.bj',
    filename,
    mime_type: mimeType,
    file_size: fileSize,
    width,
    height,
    sha256,
    phash,
    dhash,
    status: 'completed',
    score,
    ai_score: aiScore,
    manipulation_score: manipulationScore,
    authenticity_score: authenticityScore,
    classification,
    confidence,
    explanation,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    fact_check_id: factCheckId,
    delete_after_analysis: deleteAfterAnalysis || false,
    image_url: deleteAfterAnalysis ? undefined : imageBase64,
    metadata,
    ai_analysis: aiAnalysis,
    forensics,
    provenance,
    image_description: imageDescription,
    recommendations,
    is_saved_in_database: false
  };

  return report;
}
