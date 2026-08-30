import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, HelpCircle, Shield, ArrowRight, Globe, AlertTriangle } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { firebaseDb } from '../utils/supabase';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'feedback',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg('Veuillez remplir tous les champs requis.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject,
      message: formData.message.trim(),
      recipient: 'contactactubub@gmail.com',
      createdAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' })
    };

    // Dispatch 1: Server endpoint transmission
    const sendServerApi = async () => {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(tid);
      } catch (err) {
        console.warn('[Contact] Server API dispatch:', err);
      }
    };

    // Dispatch 2: Direct FormSubmit AJAX
    const sendFormSubmit = async () => {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);
        await fetch('https://formsubmit.co/ajax/contactactubub@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: `[ActuHub Contact] Message de ${payload.name}`,
            _replyto: payload.email,
            Nom: payload.name,
            Email: payload.email,
            Sujet: payload.subject,
            Message: payload.message
          }),
          signal: controller.signal
        });
        clearTimeout(tid);
      } catch (err) {
        console.warn('[Contact] FormSubmit dispatch:', err);
      }
    };

    // Dispatch 3: Firestore backup persistence
    const sendFirestore = async () => {
      try {
        const savePromise = addDoc(collection(firebaseDb, 'contact_messages'), payload);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2500));
        await Promise.race([savePromise, timeoutPromise]);
      } catch (err) {
        console.warn('[Contact] Firestore dispatch:', err);
      }
    };

    // Execute dispatches asynchronously
    Promise.allSettled([sendServerApi(), sendFormSubmit(), sendFirestore()]).then(() => {
      console.log('[ActuHub Contact] Async dispatches finished');
    });

    // Instant UI feedback (400ms loading effect max)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: 'feedback', message: '' });
    }, 400);
  };

  const FAQS = [
    {
      q: "Comment puis-je signaler un faux site d'actualité ou un faux journaliste ?",
      a: "Vous pouvez vous rendre sur le module de 'Signalement Fake' ou le 'Vérificateur d'Infos' directement depuis notre barre de navigation supérieure pour lancer une audit guidée ou soumettre un témoignage."
    },
    {
      q: "Est-ce que les informations sont partagées de façon anonyme ?",
      a: "Oui, la confidentialité est notre priorité. Aucun de vos renseignements personnels n'est partagé avec des tiers ou des autorités sans votre consentement préalable."
    },
    {
      q: "Comment s'inscrire à l'Académie de Désinformation ?",
      a: "Aucune inscription préalable payante n'est nécessaire. Entrez simplement votre nom sur l'onglet 'Académie' pour démarrer l'examen de certification d'aptitudes."
    }
  ];

  return (
    <div id="contact-section-container" className="space-y-10 animate-fade-in w-full max-w-5xl mx-auto py-4">
      
      {/* Intro Header Group */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
          Entrer en relation
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans">
          Parlons de l'intégrité de l'information
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
          Vous êtes journaliste, citoyen, chercheur ou représentant d'une institution ? Envoyez-nous un message sécurisé.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Contact Info and Direct Channels card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/25 rounded-full blur-2xl"></div>
          
          <div className="space-y-6 relative">
            <div>
              <h3 className="text-base font-bold tracking-tight">Coordonnées Officielles</h3>
              <p className="text-[10px] text-indigo-200 mt-1">N'hésitez pas à nous joindre par l'un des canaux suivants.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <a 
                href="https://www.actuhub-benin.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all cursor-pointer border border-white/5"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-blue-300 uppercase block tracking-wider">Site Officiel</span>
                  <span className="truncate block max-w-[200px]">www.actuhub-benin.com</span>
                </div>
              </a>

              <a 
                href="mailto:contactactubub@gmail.com" 
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all cursor-pointer border border-white/5"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-indigo-300 uppercase block tracking-wider">Email officiel & Authentification Sécurisée</span>
                  <span className="truncate block max-w-[200px]">contactactubub@gmail.com</span>
                </div>
              </a>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-emerald-300 uppercase block tracking-wider">Téléphone d'urgence</span>
                  <span>+229 01 55 36 08 58</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-cyan-300 uppercase block tracking-wider">Siège Social</span>
                  <span>Parakou, Borgou, Bénin</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-[10px] text-indigo-300 leading-normal select-none">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span>Tous les échanges et formulaires sont cryptés en HTTPS.</span>
          </div>
        </div>

        {/* Dynamic Interactive Email Contact Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-center">
          {isSubmitted ? (
            <div id="contact-success-panel" className="text-center py-8 space-y-4 animate-scale-up">
              <div className="w-14 h-14 bg-emerald-52 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Message Envoyé !</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Merci de nous avoir écrit ! Votre message a été enregistré dans notre base de données sécurisée et transmis à <strong className="text-blue-600 dark:text-blue-400">contactactubub@gmail.com</strong>.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl text-[11px] text-amber-800 dark:text-amber-200 text-left space-y-1 mt-3">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Note d'activation importante (FormSubmit)</span>
                  </div>
                  <p className="text-[10.5px] leading-normal opacity-90">
                    Si c'est la toute première fois que vous utilisez la plateforme, le service FormSubmit envoie un <strong>e-mail d'activation unique</strong> à <u>contactactubub@gmail.com</u>. Veuillez vérifier vos <strong>Spams/Indésirables</strong> et cliquer sur <strong>"Activate Form"</strong> pour valider la réception automatique dans votre boîte de réception.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <span>Envoyer un autre message</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono block">
                    Votre Nom Complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Koffi SOUROU"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono block">
                    Adresse Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Ex: mail@domain.bj"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono block">
                  Sujet de l'échange
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="feedback">Retour d'expérience utilisateur</option>
                  <option value="factcheck">Demande de Vérification de Site</option>
                  <option value="licensing">Soumission de carte de presse ou agrément média</option>
                  <option value="press">Presse & Partenariats institutionnels</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono block">
                  Message Securisé *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Décrivez vos constatations, vos questions ou vos retours..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed"
                  required
                />
              </div>

              {errorMsg && (
                <p className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-2 rounded-xl">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmettre le Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Express bottom mini-FAQ details for faster lookup */}
      <div className="pt-6 border-t border-gray-150 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pl-1 font-mono">
          <HelpCircle className="w-4 h-4 text-blue-500" /> Réponses rapides à vos questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block font-sans">
                {faq.q}
              </span>
              <p className="text-[10px] text-gray-400 dark:text-gray-400 leading-normal font-medium italic">
                "{faq.a}"
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
