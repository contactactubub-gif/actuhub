import React from 'react';
import { Shield, Users, Award, CheckCircle, Globe, Share2, BookOpen } from 'lucide-react';

export default function AboutSection() {
  return (
    <div id="about-section-container" className="space-y-12 animate-fade-in w-full max-w-5xl mx-auto py-4">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white p-8 md:p-12 shadow-2xl border border-indigo-800/20">
        <div className="absolute top-0 right-0 -tranzinc-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-2xl space-y-4">
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/35 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            À Propos de la Plateforme
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans leading-tight">
            ActuHub Bénin : L'information rigoureuse, certifiée et accessible.
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
            Une initiative citoyenne d'utilité publique visant à lutter contre la falsification de l'information et à valoriser le journalisme professionnel au Bénin.
          </p>
        </div>
      </div>

      {/* Structured Core Values / Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
            Lutte Contre les Fakes
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed leading-normal">
            Grâce à notre module de signalement d'urgence et notre algorithme de validation, nous identifions rapidement les rumeurs pour assainir l'espace public numérique béninois.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
            Certification Officielle
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed leading-normal">
            Nous intégrons le registre de la Haute Autorité de l’Audiovisuel et de la Communication (HAAC) pour permettre la vérification immédiate des cartes de presse professionnelles.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
            Éducation aux Médias
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed leading-normal">
            Notre Académie de Désinformation (Disinformation Academy) certifie gratuitement les citoyens à travers des parcours interactifs chronométrés.
          </p>
        </div>
      </div>

      {/* Main Narrative and Team Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Notre Démarche Citoyenne
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-4 leading-relaxed font-sans leading-normal">
            <p>
              ActuHub Bénin est un agrégateur d’actualités et un outil de clarification de l'information publique en temps réel. Face à la prolifération des rumeurs, des contrefaçons d’articles de presse et des usurpations d'identité, nous mettons à votre disposition des outils d'analyse performants.
            </p>
            <p>
              Notre plateforme permet à quiconque d'analyser un lien pour vérifier si l'éditeur du site est enregistré et reconnu auprès du registre officiel des organes de presse autorisés au Bénin.
            </p>
            <p>
              Nous collaborons activement avec des professionnels des médias, des juristes, et des spécialistes de l'analyse sémantique pour offrir un service d'utilité publique transparent, rigoureux, et sans appartenance partisane.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Nos Réalisations Clés
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-gray-650 dark:text-gray-350">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+120 Organes de presse indexés</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Vérification d'URL instantanée</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+500 Citoyens formés en ligne</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Signalements directs anonymisés</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Editorial Board Side Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
              Comité Éthique & Technique
            </h3>
            <p className="text-[10px] text-gray-400">Ceux qui veillent sur la déontologie du projet.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-105 dark:bg-blue-900/30 font-bold text-[11px] text-blue-600 dark:text-blue-400 flex items-center justify-center uppercase shrink-0">
                SD
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">Serge-Didier K.</p>
                <p className="text-[10px] text-gray-400">Président du Comité d'Éthique</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-105 dark:bg-indigo-900/30 font-bold text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center justify-center uppercase shrink-0">
                AF
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">Armelle F.</p>
                <p className="text-[10px] text-gray-400">Analyste Fact-Checking & Rédactrice</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-105 dark:bg-cyan-900/30 font-bold text-[11px] text-cyan-600 dark:text-cyan-400 flex items-center justify-center uppercase shrink-0">
                KB
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">Koffi Benjamin O.</p>
                <p className="text-[10px] text-gray-400">Ingénieur d'Intégration Médias</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 text-[10px] leading-normal text-gray-500 dark:text-gray-400 space-y-1.5">
            <p>Notre charte de fact-checking s’aligne strictement sur la convention de Munich et les textes règlementaires régissant la presse et les publications numériques au Bénin.</p>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-col gap-1 font-mono text-[9px] text-slate-600 dark:text-slate-400">
              <span>🌐 Domaine officiel : <strong className="text-blue-600 dark:text-blue-400">www.actuhub-benin.com</strong></span>
              <span>📧 Administration : <strong className="text-slate-800 dark:text-slate-200">contactactubub@gmail.com</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
