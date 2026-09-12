import React from 'react';
import jsPDF from 'jspdf';
import { Download, FileText } from 'lucide-react';
import { ImageScanReport } from '../../types';

interface PdfReportModalProps {
  report: ImageScanReport;
  onClose: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({ report, onClose }) => {

  const generateAndDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ACTUHUB - RAPPORT D\'AUTHENTICITÉ VISUELLE & IA', 14, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Fichier : ${report.filename} | ID : ${report.id}`, 14, 26);
    doc.text(`Date : ${new Date(report.created_at).toLocaleString('fr-FR')}`, 140, 26);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 38, 182, 32, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 38, 182, 32, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`SCORE DE SUSPICION IA : ${report.score} / 100`, 20, 48);

    doc.setFontSize(9.5);
    doc.text(`CLASSIFICATION : ${report.classification}`, 20, 56);
    doc.text(`NIVEAU DE CONFIANCE : ${report.confidence.toUpperCase()}`, 20, 64);

    let y = 78;

    // Identified Visual Description
    if (report.image_description || report.ai_analysis?.image_description) {
      const desc = report.image_description || report.ai_analysis?.image_description || '';
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTENU VISUEL IDENTIFIÉ', 14, y);
      y += 6;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const splitDesc = doc.splitTextToSize(desc, 180);
      doc.text(splitDesc, 14, y);
      y += (splitDesc.length * 5) + 6;
    }

    // Technical Breakdown Section
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALYSE FORENSIQUE & SIGNAUX TECHNIQUES', 14, y);
    y += 7;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');

    // AI Analysis
    const genName = report.ai_analysis?.detected_generator || report.ai_analysis?.model_name || 'Vision Forensics';
    doc.text(`• Détection & Modèle : ${report.ai_analysis?.ai_probability ?? 0}% de probabilité IA (${genName})`, 14, y);
    y += 6;

    // Provenance
    doc.text(`• Certificat C2PA : ${report.provenance?.c2pa_found ? 'Détecté (' + (report.provenance.software || 'Inconnu') + ')' : 'Non détecté'}`, 14, y);
    y += 6;

    // Metadata
    const camStr = report.metadata?.camera ? `Appareil ${report.metadata.camera}` : 'Aucune métadonnée d\'appareil photo';
    doc.text(`• Métadonnées EXIF : ${camStr}`, 14, y);
    y += 6;

    // Forensics
    doc.text(`• ELA Score : ${report.forensics?.ela_score ?? 0}/100 | Bruit : ${report.forensics?.noise_score ?? 0}/100`, 14, y);
    y += 10;

    // Human Explanation
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCLUSION ET EXPLICATION DE L\'ANALYSE', 14, y);
    y += 7;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const splitExplanation = doc.splitTextToSize(report.explanation, 180);
    doc.text(splitExplanation, 14, y);
    y += (splitExplanation.length * 5) + 10;

    // Mandatory Technical Disclaimer Box
    doc.setFillColor(254, 243, 199); // amber-100
    doc.rect(14, y, 182, 24, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.rect(14, y, 182, 24, 'S');

    doc.setTextColor(146, 64, 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('AVERTISSEMENT TECHNIQUE :', 20, y + 6);

    doc.setFont('helvetica', 'normal');
    const disclaimerText = "Cette analyse constitue une estimation technique automatisée multimodale. Elle ne remplace pas l'enquête journalistique complète. Rapport émis par Actuhub Image Check.";
    const splitDisclaimer = doc.splitTextToSize(disclaimerText, 170);
    doc.text(splitDisclaimer, 20, y + 12);

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.text('Actuhub Benin - Plateforme de Fact-Checking et Vérification de Médias | www.actuhub-benin.com', 14, 285);

    // Save PDF
    doc.save(`Actuhub_Rapport_Analyse_${report.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
          <FileText className="w-8 h-8" />
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Générer le Rapport PDF</h3>
            <p className="text-xs text-slate-500">Rapport d&apos;analyse forensique complet Actuhub</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Le document PDF contient l&apos;intégralité des signaux forensiques, la description de la scène, les métadonnées, les scores d&apos;analyse IA et l&apos;avertissement légal d&apos;évaluation technique.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={generateAndDownloadPdf}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Télécharger le PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-xs transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
