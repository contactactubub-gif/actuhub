import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, CheckSquare, RefreshCw, User, Download, 
  PlayCircle, FileBadge, Lock, CheckCircle, ArrowRight, ArrowLeft, Quote, Check, X,
  Timer, AlertCircle, GraduationCap, XCircle, Lightbulb, ShieldAlert, Newspaper, Search,
  PenTool, Eye, EyeOff, CheckCircle2, Sparkles, Filter, ChevronDown, ChevronUp, Layers, HelpCircle,
  Printer, ArrowUpRight, Share2
} from 'lucide-react';
import { Lesson, QuizQuestion, UserProfile, Advertisement } from '../types';
import { AdCarousel } from './AdCarousel';
import { LESSONS } from '../data/lessonData';
import { QUIZ_QUESTIONS_POOL } from '../data/quizData';
import { coursesService } from '../utils/supabase';
import { calculateRelevanceScore } from '../utils/searchEngine';

const getLessonIcon = (iconStr: string) => {
  if (iconStr === "newspaper" || iconStr === "📰") return <Newspaper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
  if (iconStr === "shield" || iconStr === "🛡️") return <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  if (iconStr === "search" || iconStr === "🔍") return <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
  if (iconStr === "award" || iconStr === "🏆") return <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
  return <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
};

interface DisinformationAcademyProps {
  currentUser?: UserProfile | null;
  onLoginClick?: () => void;
  advertisements?: Advertisement[];
  onTrackView?: (adId: string) => void;
  onTrackClick?: (adId: string) => void;
}

export default function DisinformationAcademy({ 
  currentUser, 
  onLoginClick,
  advertisements = [],
  onTrackView,
  onTrackClick
}: DisinformationAcademyProps) {
  // Active single course view ID
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  
  // Search and filter in catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Débutant' | 'Intermédiaire' | 'Avancé'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quiz state
  const [userName, setUserName] = useState(currentUser?.fullName || '');
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [certifiedName, setCertifiedName] = useState<string>('');
  const [certified, setCertified] = useState(false);
  const [certSerialNumber, setCertSerialNumber] = useState('');
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [incorrectQuestionIds, setIncorrectQuestionIds] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes total
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [lessonsList, setLessonsList] = useState<Lesson[]>(LESSONS);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (currentUser?.fullName) {
      setUserName(currentUser.fullName);
    }
  }, [currentUser]);

  // Load courses in real-time from Supabase Database
  useEffect(() => {
    setLoadingCourses(true);
    const unsubscribe = coursesService.subscribe((courses) => {
      if (courses && courses.length > 0) {
        setLessonsList(courses);
      } else {
        setLessonsList(LESSONS);
      }
      setLoadingCourses(false);
    });

    return () => unsubscribe();
  }, []);

  // Initialize empty exercise work
  useEffect(() => {
    setExerciseAnswers({});
    setCompletedExercises({});
  }, []);

  const handleSaveExerciseAnswer = (lessonId: string, text: string) => {
    const updated = { ...exerciseAnswers, [lessonId]: text };
    setExerciseAnswers(updated);
  };

  const handleToggleCompleted = (lessonId: string) => {
    const updated = { ...completedExercises, [lessonId]: !completedExercises[lessonId] };
    setCompletedExercises(updated);
  };

  // Countdown timer effect for quiz
  useEffect(() => {
    if (!quizStarted) return;
    
    const token = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(token);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(token);
  }, [quizStarted]);

  // Trigger handleTimeUp when timer reaches 0
  useEffect(() => {
    if (quizStarted && timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft, quizStarted]);

  const handleTimeUp = () => {
    setIsTimedOut(true);
    setQuizStarted(false);
    if (score >= Math.ceil(currentQuestions.length * 0.75)) {
      setCertified(true);
      setCertifiedName(userName || "Citoyen Engagé du Bénin");
      setCertSerialNumber(`BA-2026-${Math.floor(100000 + Math.random() * 900000)}`);
    } else {
      setCertified(false);
    }
    setIsAnswered(false);
  };

  const handleSelectAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || isAnswered) return;
    const currentQuestion = currentQuestions[currentQuestionIdx];
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    } else {
      setIncorrectQuestionIds(prev => [...prev, currentQuestion.id]);
    }
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    if (currentQuestionIdx < currentQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      if (score >= Math.ceil(currentQuestions.length * 0.75)) {
        setCertified(true);
        setCertifiedName(userName || "Citoyen Engagé du Bénin");
        setCertSerialNumber(`BA-2026-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        setCertified(false);
      }
      setQuizStarted(false);
    }
  };

  const handleRestartQuiz = () => {
    const shuffledPool = [...QUIZ_QUESTIONS_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffledPool.slice(0, 15);
    
    const dynamicQuestions = selected.map(q => {
      const markedOptions = q.options.map((opt, idx) => ({
        text: opt,
        isCorrect: idx === q.correctAnswer
      }));
      const shuffledOptions = [...markedOptions].sort(() => 0.5 - Math.random());
      const newCorrectIdx = shuffledOptions.findIndex(o => o.isCorrect);
      return {
        ...q,
        options: shuffledOptions.map(o => o.text),
        correctAnswer: newCorrectIdx
      };
    });

    setCurrentQuestions(dynamicQuestions);
    setIncorrectQuestionIds([]);
    setQuizStarted(true);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setCertified(false);
    setTimeLeft(180);
    setIsTimedOut(false);
  };

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    handleRestartQuiz();
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Categories list
  const allCategories = Array.from(new Set(lessonsList.map(l => l.category).filter(Boolean))) as string[];

  // Filtered lessons with smart relevance scoring
  const filteredLessons = React.useMemo(() => {
    let result = lessonsList.filter((les) => {
      const matchesDifficulty = selectedDifficulty === 'all' || les.difficulty === selectedDifficulty;
      const matchesCategory = selectedCategory === 'all' || les.category === selectedCategory;
      return matchesDifficulty && matchesCategory;
    });

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim();
      result = result
        .map((les) => {
          const pageContent = (les.pages || []).flatMap(p => p.sections.flatMap(s => [s.title, ...s.body])).join(' ');
          const { score } = calculateRelevanceScore(q, {
            title: les.title,
            description: les.summary,
            content: pageContent,
            sourceOrCategory: `${les.category || ''} ${les.difficulty}`,
          });
          return { lesson: les, score };
        })
        .filter((item) => item.score > 2)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.lesson);
    }

    return result;
  }, [lessonsList, searchQuery, selectedDifficulty, selectedCategory]);

  const totalExercisesDone = Object.values(completedExercises).filter(Boolean).length;

  // Selected Course details for Single-Page View
  const selectedCourseIndex = lessonsList.findIndex(l => l.id === selectedCourseId);
  const activeCourse = selectedCourseIndex >= 0 ? lessonsList[selectedCourseIndex] : null;

  const handleOpenCourseSinglePage = (courseId: string) => {
    setSelectedCourseId(courseId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseCourseSinglePage = () => {
    setSelectedCourseId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigatePreviousCourse = () => {
    if (selectedCourseIndex > 0) {
      const prevCourse = lessonsList[selectedCourseIndex - 1];
      setSelectedCourseId(prevCourse.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigateNextCourse = () => {
    if (selectedCourseIndex >= 0 && selectedCourseIndex < lessonsList.length - 1) {
      const nextCourse = lessonsList[selectedCourseIndex + 1];
      setSelectedCourseId(nextCourse.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!currentUser) {
    return (
      <div id="academy-locked-container" className="space-y-6 max-w-2xl mx-auto py-8 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
              Espace Formations & Académie de Cybersécurité
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              L'accès aux 15 cours officiels sur page unique (Guide 2026 Bénin), aux exercices pratiques intégrés et au test de certification citoyenne nécessite un compte ActuHub connecté.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-left border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>15 cours certifiés sur page unique fluide et interactive</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Exercices pratiques intégrés avec corrigés pédagogiques détaillés</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Test officiel chrono & Certificat numérique nominatif téléchargeable</span>
            </div>
          </div>

          <div className="pt-2 max-w-md mx-auto">
            <button
              onClick={onLoginClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-mono"
            >
              <User className="w-4 h-4" />
              <span>Se connecter ou S'inscrire</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     VUE PAGE UNIQUE D'UN COURS SÉLECTIONNÉ (SINGLE-PAGE LEARNING EXPERIENCE)
     ========================================================================= */
  if (activeCourse) {
    const isDone = completedExercises[activeCourse.id];
    const isSolShown = showSolution[activeCourse.id];
    const userAns = exerciseAnswers[activeCourse.id] || '';

    return (
      <div id="course-single-page-view" className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
        
        {/* Navigation Bar Top */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between flex-wrap gap-3 sticky top-2 z-20 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
          <button
            onClick={handleCloseCourseSinglePage}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Catalogue des 15 cours</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 dark:text-slate-500 font-bold">
              Module {selectedCourseIndex + 1} sur {lessonsList.length}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            {isDone ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validé
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                En cours
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNavigatePreviousCourse}
              disabled={selectedCourseIndex === 0}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Cours précédent"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNavigateNextCourse}
              disabled={selectedCourseIndex === lessonsList.length - 1}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Cours suivant"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              title="Imprimer cette fiche de cours"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        {/* Course Hero Header (Single Page) */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-md space-y-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
              Module Officiel #{selectedCourseIndex + 1}
            </span>
            {activeCourse.category && (
              <span className="bg-white/10 text-white border border-white/15 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                {activeCourse.category}
              </span>
            )}
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
              {activeCourse.difficulty}
            </span>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[10px] font-medium font-mono">
              ⏱ {activeCourse.duration}
            </span>
          </div>

          <h1 className="text-xl md:text-3xl font-black tracking-tight leading-snug">
            {activeCourse.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Éditeur certifié : <strong className="text-indigo-300">{activeCourse.publisher || "ActuHub Bénin • Académie"}</strong></span>
            <span>•</span>
            <span>Date : {activeCourse.publishedAt || "2026"}</span>
          </div>
        </div>

        {/* Quick Anchor Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <a
            href="#synthese"
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-300 whitespace-nowrap"
          >
            📌 Synthèse & Objectifs
          </a>
          <a
            href="#contenu-cours"
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-300 whitespace-nowrap"
          >
            📖 Leçon Intégrale
          </a>
          {activeCourse.exercise && (
            <>
              <a
                href="#atelier-pratique"
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 hover:border-amber-400 text-amber-800 dark:text-amber-300 whitespace-nowrap font-bold"
              >
                ✍️ Exercice Pratique
              </a>
              <a
                href="#corrigé-officiel"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 hover:border-emerald-400 text-emerald-800 dark:text-emerald-300 whitespace-nowrap font-bold"
              >
                💡 Corrigé & Points Clés
              </a>
            </>
          )}
        </div>

        {/* 1. SYNTHÈSE & RÉSUMÉ CLÉ */}
        <section id="synthese" className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-6 rounded-3xl space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-wider font-mono">
            <Quote className="w-4 h-4" />
            <span>Synthèse Pédagogique & Notions Essentielles</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
            {activeCourse.summary}
          </p>
        </section>

        {/* 2. LEÇON INTÉGRALE (TOUTES LES PAGES ET SECTIONS SUR UNE PAGE UNIQUE) */}
        <section id="contenu-cours" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-sm">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4 space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Contenu Intégral du Module</span>
            </div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
              Développement et Fondamentaux
            </h2>
          </div>

          <div className="space-y-8">
            {activeCourse.pages && activeCourse.pages.map((page, pageIdx) => (
              <div key={pageIdx} className="space-y-5 bg-slate-50/60 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-150 dark:border-slate-800">
                <h3 className="text-sm md:text-base font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2.5 border-b border-indigo-100 dark:border-indigo-900/60 pb-3">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>{page.title}</span>
                </h3>

                <div className="space-y-6">
                  {page.sections && page.sections.map((section, secIdx) => (
                    <div key={secIdx} className="space-y-3">
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide font-mono bg-white dark:bg-slate-900 inline-block px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                        {section.title}
                      </h4>
                      <div className="space-y-3 pl-1">
                        {section.body && section.body.map((paragraph, pIdx) => (
                          <p key={pIdx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. ATELIER PRATIQUE & EXERCICE SUR LA MÊME PAGE */}
        {activeCourse.exercise && (
          <section id="atelier-pratique" className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            
            <div className="border-b border-amber-100 dark:border-amber-900/60 pb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-amber-600 dark:text-amber-400 font-mono tracking-wider">
                  <PenTool className="w-4 h-4" />
                  <span>Atelier Pratique & Cas d'Application</span>
                </div>
                <h3 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white">
                  {activeCourse.exercise.title}
                </h3>
              </div>

              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-[10px] font-black font-mono uppercase">
                Exercice Intégré
              </span>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl">
              <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
                {activeCourse.exercise.instructions}
              </p>
            </div>

            {/* Questions to solve */}
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono block">
                Questions d'application :
              </span>
              <div className="space-y-2.5">
                {activeCourse.exercise.questions.map((q, qIdx) => (
                  <div key={qIdx} className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {qIdx + 1}
                    </span>
                    <span className="pt-0.5">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive student workspace */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono block">
                Votre espace de réponse (sauvegarde automatique en temps réel) :
              </label>
              <textarea
                value={userAns}
                onChange={(e) => handleSaveExerciseAnswer(activeCourse.id, e.target.value)}
                placeholder="Rédigez vos éléments de réponse, analyse et réflexions pour ce cours..."
                rows={4}
                className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed shadow-inner"
              />
            </div>

            {/* Actions for exercise */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                id="corrigé-officiel"
                type="button"
                onClick={() => setShowSolution(prev => ({ ...prev, [activeCourse.id]: !prev[activeCourse.id] }))}
                className="px-5 py-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                {isSolShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{isSolShown ? "Masquer le corrigé officiel" : "Consulter le Corrigé Officiel & Points Clés"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleCompleted(activeCourse.id)}
                className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  isDone
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300 dark:ring-emerald-800'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isDone ? "Module & Exercice Validés ✓" : "Valider ce module"}</span>
              </button>
            </div>

            {/* Solution guide */}
            {isSolShown && activeCourse.exercise.solutionGuide && (
              <div className="p-6 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-3 animate-slide-down">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider font-mono">
                    Corrigé Pédagogique Officiel (Guide 2026 Bénin) :
                  </span>
                </div>
                <ul className="space-y-2.5 pl-2">
                  {activeCourse.exercise.solutionGuide.map((sol, solIdx) => (
                    <li key={solIdx} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed list-disc list-inside">
                      {sol}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </section>
        )}

        {/* Navigation Footer at bottom of single page course */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleCloseCourseSinglePage}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tous les cours (Catalogue)</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedCourseIndex > 0 && (
              <button
                onClick={handleNavigatePreviousCourse}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cours {selectedCourseIndex}</span>
              </button>
            )}

            {selectedCourseIndex < lessonsList.length - 1 ? (
              <button
                onClick={handleNavigateNextCourse}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md font-mono"
              >
                <span>Cours {selectedCourseIndex + 2} : Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCloseCourseSinglePage}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md font-mono"
              >
                <Award className="w-4 h-4" />
                <span>Passer l'Épreuve Finale de Certification</span>
              </button>
            )}
          </div>
        </div>

      </div>
    );
  }

  /* =========================================================================
     VUE GLOBALE DU CATALOGUE DES 15 COURS & EXAMEN DE CERTIFICATION
     ========================================================================= */
  return (
    <div id="academy-main-block" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Academy intro pitch banner */}
      <div id="academy-banner" className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden">
        <div className="space-y-2.5 max-w-xl text-center md:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Guide Officiel de Formation Bénin 2026 • 15 Modules</span>
          </div>
          <h2 className="text-lg md:text-2xl font-black tracking-tight leading-tight">
            Académie de Cybersécurité, Droit Numérique & Fact-Checking
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Chaque cours est structuré sur <strong>une page unique</strong> avec son contenu détaillé, ses points clés et son <strong>atelier pratique d'application</strong> directement accessible.
          </p>
        </div>

        <div className="shrink-0 bg-white/5 border border-white/10 p-5 rounded-2xl text-center flex flex-col items-center justify-center gap-1 min-w-[170px] z-10 backdrop-blur-sm">
          <GraduationCap className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
          <span className="text-xs font-black text-white">{lessonsList.length} Cours sur Page Unique</span>
          <span className="text-[10px] text-emerald-400 font-bold font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {totalExercisesDone} / {lessonsList.length} validés
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Synchronisé en temps réel</span>
        </div>
      </div>

      {/* Carousel publicitaire défilable (3s) au-dessus du Test de Certification */}
      <AdCarousel
        advertisements={advertisements}
        onTrackView={onTrackView}
        onTrackClick={onTrackClick}
        autoPlayInterval={3000}
        className="my-6"
      />

      {/* Certification exam center */}
      <section id="certification-exam-sec" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div id="exam-header-row" className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Test de Certification de Citoyen Numérique Responsable
            </h3>
          </div>
          {quizStarted && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all ${
              timeLeft <= 30 
                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse scale-105' 
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900'
            }`}>
              <Timer className={`w-4 h-4 ${timeLeft <= 30 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400 animate-spin'}`} style={timeLeft > 30 ? { animationDuration: '6s' } : {}} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {!quizStarted && !certified && (
          <form id="start-exam-form" onSubmit={handleStartExam} className="space-y-5 text-center sm:text-left">
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal max-w-xl">
              Après avoir étudié les 15 cours et résolu les exercices, validez vos compétences pour obtenir votre <strong>Certificat officiel nominatif</strong>.
              <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">Épreuve chronométrée (3 minutes, 15 questions aléatoires, 75% requis).</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                id="exam-user-name"
                type="text"
                required
                placeholder="Entrez votre nom et prénom..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="flex-1 text-xs border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                id="start-exam-submit"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Démarrer l'Épreuve
              </button>
            </div>
          </form>
        )}

        {quizStarted && (
          <div id="active-quiz-container" className="space-y-6">
            
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wide font-mono">
                <span>Question {currentQuestionIdx + 1} sur {currentQuestions.length}</span>
                <span>Score actuel : {score}</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all rounded-full" 
                  style={{ width: `${((currentQuestionIdx + 1) / currentQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Title question */}
            <div className="space-y-4">
              <h4 id="question-text" className="text-sm font-extrabold text-gray-900 dark:text-slate-100 tracking-tight leading-snug">
                {currentQuestions[currentQuestionIdx].question}
              </h4>
              
              {/* Question list options */}
              <div className="space-y-2.5">
                {currentQuestions[currentQuestionIdx].options.map((opt: string, idx: number) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = currentQuestions[currentQuestionIdx].correctAnswer === idx;
                  return (
                    <button
                      id={`opt-btn-${idx}`}
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={isAnswered}
                      className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold transition-all border flex gap-3 items-center cursor-pointer ${
                        isAnswered
                          ? isCorrect 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-300'
                            : isSelected 
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'
                              : 'bg-white dark:bg-slate-900 border-transparent text-gray-400'
                          : isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-900 dark:text-indigo-200 scale-[1.01]'
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:border-indigo-300 hover:bg-indigo-50/10'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center shrink-0 text-[10px] ${
                        isAnswered
                          ? isCorrect
                            ? 'bg-emerald-500 text-white'
                            : isSelected
                              ? 'bg-rose-500 text-white'
                              : 'bg-gray-100 text-gray-300'
                          : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Answer detail explanation */}
            {isAnswered && (
              <div id="quiz-explanation-box" className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2 animate-fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Explication pédagogique</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{currentQuestions[currentQuestionIdx].explanation}</p>
              </div>
            )}

            {/* Navigator action trigger in exam */}
            <div id="quiz-navigator" className="flex justify-end pt-2">
              {!isAnswered ? (
                <button
                  id="quiz-submit-ans"
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Valider ma Réponse
                </button>
              ) : (
                <button
                  id="quiz-next-quest"
                  onClick={handleNextQuestion}
                  className="bg-gray-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{currentQuestionIdx < currentQuestions.length - 1 ? "Question Suivante" : "Terminer et corriger le test"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        )}

        {/* Certified validation view */}
        {certified && !quizStarted && (
          <div id="certified-sucess" className="space-y-6 text-center animate-fade-in duration-500">
            <div className="space-y-2">
              <span className="inline-flex p-3.5 rounded-full bg-emerald-500/10 text-emerald-600 animate-bounce">
                <GraduationCap className="w-8 h-8" />
              </span>
              <h4 className="text-base font-extrabold text-emerald-950 dark:text-emerald-400 uppercase tracking-wide">
                Félicitations ! Vous êtes certifié Citoyen Numérique Responsable
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xl mx-auto leading-normal">
                {isTimedOut ? (
                  <span className="text-amber-600 font-bold block mb-2 flex items-center justify-center gap-1.5"><Timer className="w-4 h-4" /> Temps Écoulé ! Mais vous avez validé le score minimum à temps.</span>
                ) : null}
                Vous avez obtenu l'excellent score de <strong>{score} / {currentQuestions.length}</strong>. Vos compétences en cybersécurité et analyse de sources sont validées.
              </p>
            </div>

            {/* Custom generated Printable certificate structure */}
            <div 
              id="citizen-printed-certificate" 
              className="border-8 border-double border-yellow-600 p-6 md:p-10 bg-slate-950 text-white rounded-3xl mx-auto max-w-xl text-center space-y-6 shadow-xl relative overflow-hidden"
              style={{ backgroundImage: "radial-gradient(circle at center, #111827 0%, #030712 100%)" }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-600/5 rounded-full border border-yellow-600/10 flex items-center justify-center text-5xl font-bold opacity-30 select-none pointer-events-none">
                ACTUHUB
              </div>

              <div className="space-y-1.5 relative z-10 shrink-0">
                <span className="text-yellow-500 text-3xl block">🏆</span>
                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest block font-mono">Certificat d'Aptitude de Citoyenneté Numérique</span>
              </div>

              <div className="space-y-2 relative z-10">
                <p className="text-xs text-gray-400 capitalize tracking-wide font-sans">Le présent document atteste solennellement que</p>
                <h2 className="text-xl md:text-3xl font-black text-white tracking-tight leading-none uppercase select-all" style={{ fontFamily: "Outfit" }}>
                  {certifiedName}
                </h2>
                <div className="w-24 h-0.5 bg-yellow-600 mx-auto mt-2"></div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto relative z-10 font-sans leading-normal">
                a suivi et validé avec succès l'ensemble du programme de <strong>Cybersécurité, Droit Numérique Béninois et Prévention des Fraudes (Guide 2026)</strong>. Est habilité(e) comme <strong>Citoyen Numérique Responsable</strong>.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-yellow-600/20 text-left text-[9px] relative z-10 font-semibold uppercase tracking-wider text-gray-400">
                <div className="space-y-0.5">
                  <span>Le Directeur d'Académie</span>
                  <span className="font-extrabold text-white block font-serif tracking-widest italic pt-1">Christian G.</span>
                </div>
                <div className="space-y-0.5 text-right">
                  <span>Enregistrement n°</span>
                  <span className="font-bold text-yellow-500 block font-mono tracking-wider pt-1">{certSerialNumber}</span>
                </div>
              </div>
            </div>

            <div id="certificate-toolbar" className="flex items-center justify-center gap-3 text-xs pt-2 flex-wrap">
              <button
                id="certified-print"
                onClick={handlePrintCertificate}
                className="bg-indigo-600 hover:bg-slate-900 border border-indigo-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Imprimer / Télécharger CERTIFICAT</span>
              </button>
              <button
                id="certified-restart-test"
                onClick={handleRestartQuiz}
                className="bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-250 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-bold px-5 py-3 rounded-2xl transition-all cursor-pointer"
              >
                Repasser le Test
              </button>
            </div>
          </div>
        )}

        {/* Failed notification screen prompt exam */}
        {!certified && !quizStarted && (score > 0 || isTimedOut) && (
          <div id="certified-fail-card" className="space-y-5 text-center animate-fade-in leading-normal p-4 bg-red-50 dark:bg-rose-950/20 border border-red-100 dark:border-rose-900/40 rounded-3xl flex flex-col items-center">
            <span className="p-3 bg-red-100 dark:bg-rose-900/40 text-red-600 dark:text-rose-400 rounded-full inline-block">
              <XCircle className="w-8 h-8" />
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-red-950 dark:text-rose-300 uppercase tracking-wide">
                {isTimedOut ? "Temps Écoulé ! Test Non Validé" : "Test Non Validé"}
              </h4>
              <div className="text-xs text-red-750 dark:text-rose-300 max-w-sm mx-auto">
                {isTimedOut ? (
                  <p className="font-bold text-red-900 dark:text-rose-200 mb-2">Vous n'avez pas terminé le test avant la fin du temps imparti (3 minutes).</p>
                ) : (
                  <p className="font-medium text-red-800 dark:text-rose-200 mb-2">Vous avez obtenu la note de {score} / {currentQuestions.length}. Le score minimum requis est de 75%.</p>
                )}
                Relisez les 15 cours ci-dessous et retentez votre chance.
              </div>
            </div>
            <button
              id="ref-restart-test-btn"
              onClick={handleRestartQuiz}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <span>Relancer le Test</span>
            </button>
          </div>
        )}
      </section>

      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un module, sujet ou mot-clé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'Débutant', 'Intermédiaire', 'Avancé'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {diff === 'all' ? 'Tous niveaux' : diff}
              </button>
            ))}
          </div>
        </div>

        {allCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Toutes thématiques
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <span>{filteredLessons.length} modules disponibles</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            {totalExercisesDone} / {lessonsList.length} cours validé(s)
          </span>
        </div>
      </div>

      {/* Lesson Modules Grid in Catalog */}
      <div id="lessons-modules-sec" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.map((les, index) => {
            const isDone = completedExercises[les.id];

            return (
              <div
                id={`lesson-card-${les.id}`}
                key={les.id}
                onClick={() => handleOpenCourseSinglePage(les.id)}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        Module #{index + 1}
                      </span>
                      {les.category && (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                          {les.category}
                        </span>
                      )}
                    </div>

                    {isDone ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                        <CheckCircle className="w-3 h-3" />
                        Validé
                      </span>
                    ) : (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-medium font-mono">
                        {les.duration}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {les.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {les.summary}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>{les.difficulty}</span>
                    {les.exercise && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Exercice inclus</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCourseSinglePage(les.id);
                    }}
                    className="inline-flex items-center gap-1.5 font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform text-xs font-mono"
                  >
                    <span>Ouvrir la page du cours</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
