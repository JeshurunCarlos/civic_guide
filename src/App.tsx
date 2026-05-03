import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Vote, 
  Settings as SettingsIcon, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  Send, 
  BookOpen, 
  Flag, 
  Clock, 
  Megaphone, 
  Hash, 
  ShieldCheck, 
  Map, 
  CheckSquare, 
  FileText, 
  Users, 
  Award,
  Zap,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Info,
  Library,
  Search,
  Activity,
  Eye,
  Bell,
  Fingerprint
} from 'lucide-react';
import { ELECTION_STAGES, EXTERNAL_RESOURCES, ELECTORAL_GLOSSARY, QUIZ_DATA } from './constants';
import { askElectionAssistant, generateStageContent } from './services/geminiService';

const COLORS = {
  bgLight: '#f7f6f2',
  surfaceLight: '#f9f8f5',
  bgDark: '#171614',
  surfaceDark: '#1c1b19',
  primary: '#01696f',
  secondary: '#d19900',
  textLight: '#28251d',
  textDark: '#cdccca',
  wrong: '#a12c7b',
  correct: '#437a22'
};

const ICON_MAP: Record<string, any> = {
  FileText, Users, Award, Megaphone, Clock, CheckSquare, Hash, ShieldCheck, Map, Flag, Bell, Fingerprint
};

interface AppState {
  experienceLevel: 'beginner' | 'intermediate' | 'wellversed';
  contentStyle: 'elaborate' | 'concise';
  quizEnabled: boolean;
  electionType: 'presidential' | 'midterm' | 'local' | 'international';
  jurisdiction: string;
  animSpeed: 'slow' | 'normal' | 'fast';
  reduceMotion: boolean;
  currentStageIndex: number;
  completedStages: Set<number>;
  onboardingComplete: boolean;
  quizScores: { stageIndex: number; correct: number; total: number }[];
}

const ShufflingCards = () => {
  const cards = useMemo(() => [...Array(8)].map((_, i) => ({
    id: i,
    delay: i * 0.8,
    duration: 12 + Math.random() * 8,
    rotation: Math.random() * 30 - 15,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
      {cards.map((card) => (
        <motion.div
          key={card.id}
          initial={{ 
            x: '-120%', 
            y: '20%', 
            rotate: card.rotation,
            opacity: 0 
          }}
          animate={{ 
            x: ['-20%', '120%'],
            y: ['20%', '10%', '30%', '20%'],
            rotate: [card.rotation, card.rotation + 5, card.rotation - 5, card.rotation],
            opacity: [0, 0.4, 0.4, 0]
          }}
          transition={{
            duration: card.duration,
            repeat: Infinity,
            ease: "linear",
            delay: card.delay
          }}
          className="absolute left-0 top-1/2 w-48 h-64 bg-white rounded-2xl border border-black/5 shadow-xl flex flex-col p-6 space-y-4"
          style={{
            marginTop: '-128px'
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#01696f]/10 flex items-center justify-center">
            <Vote size={16} className="text-[#01696f]/20" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-black/5 rounded-full" />
            <div className="h-3 w-2/3 bg-black/5 rounded-full" />
            <div className="h-3 w-4/5 bg-black/5 rounded-full" />
          </div>
          <div className="flex-1 flex items-end justify-between">
            <div className="w-6 h-6 rounded-full bg-black/5" />
            <div className="w-12 h-4 bg-[#d19900]/10 rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>({
    experienceLevel: 'beginner',
    contentStyle: 'elaborate',
    quizEnabled: true,
    electionType: 'presidential',
    jurisdiction: 'India',
    animSpeed: 'normal',
    reduceMotion: false,
    currentStageIndex: -1,
    completedStages: new Set(),
    onboardingComplete: false,
    quizScores: []
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isExplanationBookOpen, setIsExplanationBookOpen] = useState(false);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [activePopupData, setActivePopupData] = useState<any>(null);
  const [isLoadingPopup, setIsLoadingPopup] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const durationMultiplier = useMemo(() => {
    if (state.animSpeed === 'slow') return 1.6;
    if (state.animSpeed === 'fast') return 0.5;
    return 1;
  }, [state.animSpeed]);

  const springConfig = useMemo(() => ({
    type: 'spring',
    damping: 25,
    stiffness: 120,
    mass: 1
  }), []);

  const handleOnboardingNext = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const [quizToMatch, setQuizToMatch] = useState<any>(null);

  const startJourney = () => {
    setState(prev => ({ ...prev, onboardingComplete: true, currentStageIndex: 0 }));
    setIsOnboardingVisible(false);
  };

  const advanceStage = (index?: number) => {
    const nextIndex = typeof index === 'number' ? index : (state.currentStageIndex + 1);
    
    if (nextIndex >= ELECTION_STAGES.length) {
      setState(prev => ({ ...prev, currentStageIndex: 10 })); // 10 is finished
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      currentStageIndex: nextIndex,
      completedStages: new Set([...prev.completedStages, prev.currentStageIndex])
    }));
  };

  const handleStageComplete = () => {
    setActivePopupData(null);
    if (state.quizEnabled) {
      setQuizToMatch(ELECTION_STAGES[state.currentStageIndex]);
    } else {
      advanceStage();
    }
  };

  const handleQuizDone = () => {
    setQuizToMatch(null);
    advanceStage();
  };

  useEffect(() => {
    if (state.currentStageIndex >= 0 && state.onboardingComplete) {
      loadStageContent(state.currentStageIndex);
    }
  }, [state.currentStageIndex, state.experienceLevel, state.contentStyle]);

  async function loadStageContent(index: number) {
    setIsLoadingPopup(true);
    const stage = ELECTION_STAGES[index];
    const data = await generateStageContent(
      stage.id,
      stage.title,
      state.experienceLevel,
      state.contentStyle,
      state.electionType,
      state.jurisdiction
    );
    setActivePopupData(data);
    setIsLoadingPopup(false);
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAssistantLoading) return;
    const msg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setIsAssistantLoading(true);
    const res = await askElectionAssistant(msg, chatHistory);
    setChatHistory(prev => [...prev, { role: 'model', content: res }]);
    setIsAssistantLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAssistantLoading]);

  return (
    <div className={`fixed inset-0 overflow-hidden font-sans selection:bg-[#01696f] selection:text-white transition-colors duration-500
      ${state.experienceLevel === 'wellversed' ? 'text-[#28251d]' : 'text-[#28251d]'}
      bg-[#f7f6f2]`}
      style={{
        '--anim-speed-multiplier': durationMultiplier
      } as any}
    >
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <Vote className="text-[#01696f]" size={28} />
          <span className="font-serif italic font-bold text-2xl">CivicGuide</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsExplanationBookOpen(true)}
            title="Explanation Book"
            className="p-2.5 rounded-full bg-white shadow-sm border border-black/5 hover:bg-[#01696f]/5 transition-colors"
          >
            <BookOpen size={20} />
          </button>
          <button 
            onClick={() => setIsDictionaryOpen(true)}
            title="Electoral Dictionary"
            className="p-2.5 rounded-full bg-white shadow-sm border border-black/5 hover:bg-[#01696f]/5 transition-colors"
          >
            <Library size={20} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-full bg-white shadow-sm border border-black/5 hover:bg-[#01696f]/5 transition-colors"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative w-full h-full pt-16 flex flex-col">
        {state.currentStageIndex === -1 ? (
          <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-center p-8 gap-12 z-10">
            <ShufflingCards />
            <div className="max-w-xl space-y-8 text-center md:text-left relative z-10">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-light font-serif leading-tight"
              >
                Your Vote, <br />
                <span className="italic font-bold text-[#01696f]">Simplified.</span>
              </motion.h1>
              <p className="text-xl text-[#28251d] opacity-70 leading-relaxed font-sans">
                Embark on a guided journey through the election lifecycle. 
                Learn, interact, and prepare to make your voice heard.
              </p>
              <button 
                onClick={() => setIsOnboardingVisible(true)}
                className="px-12 py-5 bg-[#01696f] text-white rounded-full font-bold text-lg shadow-xl hover:bg-[#014d51] transition-all transform hover:scale-105"
              >
                Explore the Process
              </button>
            </div>
          </div>
        ) : state.currentStageIndex === 10 ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 z-10 text-center">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-2xl space-y-8"
             >
               <div className="w-24 h-24 bg-[#01696f] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                 <Check size={48} />
               </div>
               <h1 className="text-5xl font-serif">Journey Complete.</h1>
               <p className="text-xl opacity-70">You've explored every stage of the election process. Knowledge is your most powerful tool in the voting booth.</p>
               <div className="flex gap-4 justify-center">
                 <button 
                  onClick={() => setState(prev => ({ ...prev, currentStageIndex: -1 }))}
                  className="px-8 py-3 border-2 border-black/10 rounded-full font-bold hover:bg-black hover:text-white transition-all"
                 >
                   Back to Start
                 </button>
                 <a 
                  href="https://vote.gov" 
                  target="_blank" 
                  className="px-8 py-3 bg-[#01696f] text-white rounded-full font-bold shadow-lg"
                 >
                   Verify Registration
                 </a>
               </div>
             </motion.div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="h-[30%] flex flex-col items-center justify-center text-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl space-y-4"
              >
                <h1 className="text-4xl md:text-5xl font-serif font-light leading-tight">
                  The <span className="italic font-bold text-[#01696f]">Race</span> to Election Day
                </h1>
                <p className="text-base opacity-60">
                  Tap any checkpoint to dive into the mechanics of democracy.
                </p>
              </motion.div>
            </div>

              {/* Race Track Section */}
              <motion.div 
                animate={{ 
                  y: (activePopupData || isLoadingPopup) ? "45%" : "0%",
                  scale: (activePopupData || isLoadingPopup) ? 0.8 : 1,
                  opacity: (activePopupData || isLoadingPopup) ? 0.7 : 1
                }}
                transition={{ type: "spring", damping: 30, stiffness: 100 }}
                className="flex-1 relative cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button') || 
                      (e.target as HTMLElement).closest('.modal-content')) return;
                  advanceStage();
                }}
              >
                <Timeline 
                  stages={ELECTION_STAGES} 
                  currentIndex={state.currentStageIndex} 
                  completedStages={state.completedStages}
                  onNodeClick={advanceStage}
                  reduceMotion={state.reduceMotion}
                />

                {state.currentStageIndex >= 0 && state.currentStageIndex < 8 && !activePopupData && (
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
                    <motion.p 
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#01696f]"
                    >
                      Click To Continue to Next Step
                    </motion.p>
                  </div>
                )}
              </motion.div>
          </>
        )}

        {isOnboardingVisible && !state.onboardingComplete && (
          <Onboarding 
            state={state} 
            onUpdate={handleOnboardingNext} 
            onDone={startJourney}
          />
        )}
      </div>

      {/* Floating Assistant Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-[#01696f] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <motion.div
           animate={{ rotate: [0, 10, -10, 0] }}
           transition={{ duration: 4, repeat: Infinity }}
        >
          <Megaphone size={28} />
        </motion.div>
        <span className="absolute right-20 px-3 py-1.5 bg-white text-[#01696f] text-xs font-bold rounded-lg shadow-sm border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Ask Assistant
        </span>
      </button>

      {/* Pop-up Modals */}
      <AnimatePresence>
        {state.currentStageIndex >= 0 && (activePopupData || isLoadingPopup) && (
          <StageModal 
            stage={ELECTION_STAGES[state.currentStageIndex]}
            data={activePopupData}
            style={state.contentStyle}
            level={state.experienceLevel}
            onClose={() => { setActivePopupData(null); setIsLoadingPopup(false); }}
            onNext={handleStageComplete}
            isLoading={isLoadingPopup}
          />
        )}
      </AnimatePresence>

      {/* Quiz Card */}
      <AnimatePresence>
        {quizToMatch && (
          <QuizCard 
            stage={quizToMatch}
            level={state.experienceLevel}
            onDone={handleQuizDone}
            multiplier={durationMultiplier}
          />
        )}
      </AnimatePresence>

      {/* Dictionary Modal */}
      <AnimatePresence>
        {isDictionaryOpen && (
          <DictionaryModal onClose={() => setIsDictionaryOpen(false)} />
        )}
      </AnimatePresence>

      {/* Explanation Book Modal */}
      <AnimatePresence>
        {isExplanationBookOpen && (
          <ExplanationBookModal onClose={() => setIsExplanationBookOpen(false)} />
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel 
            state={state} 
            setState={setState} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Assistant Sidebar */}
      <AnimatePresence>
        {isAssistantOpen && (
          <AssistantSidebar 
            history={chatHistory}
            input={chatInput}
            setInput={setChatInput}
            onSend={handleSendMessage}
            onClose={() => setIsAssistantOpen(false)}
            isLoading={isAssistantLoading}
            chatEndRef={chatEndRef}
            currentStage={state.currentStageIndex >= 0 ? ELECTION_STAGES[state.currentStageIndex] : null}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Onboarding({ state, onUpdate, onDone }: { state: AppState, onUpdate: (u: Partial<AppState>) => void, onDone: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#f7f6f2]/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white p-10 rounded-[40px] shadow-2xl max-w-2xl w-full border border-black/5 space-y-10"
      >
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {[1, 2].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-[#01696f]' : 'w-4 bg-black/10'}`} />
            ))}
          </div>
          <span className="text-xs font-bold uppercase tracking-widest opacity-40">Setup Journey</span>
        </div>

        {step === 1 ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-serif">What's your experience level?</h2>
              <p className="opacity-60">We'll tailor the language and depth to your needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'beginner', label: 'Beginner', desc: 'New to elections. Explain from scratch.' },
                { id: 'intermediate', label: 'Intermediate', desc: 'Know basics. Want mechanics.' },
                { id: 'wellversed', label: 'Well-Versed', desc: 'Full picture. Nuance and detail.' }
              ].map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => onUpdate({ experienceLevel: lvl.id as any })}
                  className={`p-6 text-left rounded-3xl border-2 transition-all ${
                    state.experienceLevel === lvl.id ? 'border-[#01696f] bg-[#01696f]/5 ring-4 ring-[#01696f]/10' : 'border-black/5 hover:border-black/20'
                  }`}
                >
                  <h3 className="font-bold text-lg mb-1">{lvl.label}</h3>
                  <p className="text-xs opacity-60 leading-relaxed">{lvl.desc}</p>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full py-5 bg-[#01696f] text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              Next Step <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-serif">Choose your content style</h2>
              <p className="opacity-60">Control how much detail is shown at each stage.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'elaborate', label: 'Elaborate', desc: 'Show deep dives, sections and dropdowns.' },
                { id: 'concise', label: 'Concise', desc: 'Give clear, sharp summaries.' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => onUpdate({ contentStyle: s.id as any })}
                  className={`p-6 text-left rounded-3xl border-2 transition-all ${
                    state.contentStyle === s.id ? 'border-[#01696f] bg-[#01696f]/5 ring-4 ring-[#01696f]/10' : 'border-black/5 hover:border-black/20'
                  }`}
                >
                  <h3 className="font-bold text-lg mb-1">{s.label}</h3>
                  <p className="text-xs opacity-60 leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="p-5 border-2 border-black/5 rounded-2xl hover:bg-black/5 transition-colors"><ChevronLeft size={20}/></button>
              <button 
                onClick={onDone}
                className="flex-1 py-5 bg-[#01696f] text-white rounded-2xl font-bold"
              >
                Start Learning
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Timeline({ stages, currentIndex, completedStages, onNodeClick, reduceMotion }: { stages: any[], currentIndex: number, completedStages: Set<number>, onNodeClick: (i: number) => void, reduceMotion: boolean }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const [isDrawn, setIsDrawn] = useState(false);
  useEffect(() => {
    setTimeout(() => setIsDrawn(true), 400);
  }, []);

  const trackPath = isMobile 
    ? "M 50 50 L 50 950" 
    : "M 100 200 L 1200 200";

  const getPos = (i: number) => {
    const ratio = i / (stages.length - 1);
    if (isMobile) return { x: 50, y: 50 + ratio * 900 };
    return { x: 100 + ratio * 1100, y: 200 };
  };

  const currentPos = getPos(currentIndex);

  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center p-6 md:p-12">
      <svg className="w-full h-full" viewBox={isMobile ? "0 0 100 1000" : "0 0 1300 400"} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <path 
          d={trackPath} 
          stroke="rgba(40,37,29,0.06)" 
          strokeWidth="12" 
          strokeLinecap="round" 
          fill="none" 
        />
        
        <motion.path 
          d={trackPath} 
          stroke="#01696f" 
          strokeWidth="12" 
          strokeLinecap="round" 
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: isDrawn ? (currentIndex + 1) / stages.length : 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: 'url(#glow)' }}
        />

        {/* Trail Effect */}
        {!reduceMotion && currentIndex >= 0 && (
          <motion.circle
            cx={currentPos.x}
            cy={currentPos.y}
            r="15"
            fill="#01696f"
            initial={false}
            animate={{ opacity: [0.3, 0], scale: [1, 2] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}

        {/* The Indicator */}
        <motion.g
          initial={false}
          animate={{ x: currentPos.x, y: currentPos.y }}
          transition={{ type: reduceMotion ? 'tween' : 'spring', damping: 25, stiffness: 100, duration: reduceMotion ? 0.1 : undefined }}
        >
          <circle r="12" fill="#01696f" stroke="white" strokeWidth="4" />
          <motion.circle 
            r="18" 
            stroke="#01696f" 
            strokeWidth="2" 
            fill="none"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.g>

        {stages.map((stage: any, i: number) => {
          const { x, y } = getPos(i);
          const isActive = currentIndex === i;
          const isCompleted = completedStages.has(i);
          const IconComp = ICON_MAP[stage.icon];

          return (
            <g key={stage.id} onClick={(e) => { e.stopPropagation(); onNodeClick(i); }} className="cursor-pointer group">
              {/* Point Node */}
              <motion.circle
                cx={x}
                cy={y}
                r={isActive ? "28" : "22"}
                fill={isActive ? "#01696f" : isCompleted ? "#d19900" : "white"}
                stroke={isActive ? "rgba(1,105,111,0.2)" : "rgba(0,0,0,0.05)"}
                strokeWidth={isActive ? "16" : "2"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', damping: 12 }}
                whileHover={{ scale: 1.15 }}
                style={isActive ? { filter: 'url(#glow)' } : {}}
              />

              {isCompleted && !isActive && (
                <motion.path
                  d={`M ${x-6} ${y} L ${x-1} ${y+5} L ${x+7} ${y-5}`}
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
              )}
              {!isCompleted && !isActive && IconComp && (
                <IconComp x={x-10} y={y-10} size={20} className="opacity-10 text-black" />
              )}
              {isActive && IconComp && (
                <IconComp x={x-10} y={y-10} size={20} className="text-white" />
              )}
              
              <motion.text
                x={x}
                y={isMobile ? y : y + 65}
                dx={isMobile ? 45 : 0}
                dy={isMobile ? 5 : 0}
                textAnchor={isMobile ? "start" : "middle"}
                animate={{ 
                  opacity: isActive ? [1, 0.4, 1] : [0.6, 0.2, 0.6],
                  scale: isActive ? [1, 1.05, 1] : [1, 0.98, 1]
                }}
                transition={{ 
                  duration: isActive ? 1.5 : 3, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
                className={`text-[9px] font-extrabold uppercase tracking-[0.25em] transition-all duration-300 pointer-events-none font-sans
                  ${isActive ? 'fill-[#01696f]' : isCompleted ? 'fill-[#d19900]' : 'fill-black/30 group-hover:fill-black'}`}
              >
                {stage.title}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StageModal({ stage, data, style, level, onClose, onNext, isLoading }: any) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-start justify-center pt-24 p-6 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`modal-content pointer-events-auto bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-[40px] border border-black/5 flex flex-col relative overflow-hidden
          ${style === 'elaborate' ? 'w-full max-w-xl max-h-[50vh]' : 'w-full max-w-sm'}`}
      >
        {/* Scroll Progress for Elaborate */}
        {style === 'elaborate' && <div className="h-1.5 w-full bg-[#f7f6f2] absolute top-0 left-0"><div className="h-full bg-[#01696f] transition-all" /></div>}

        <div className="p-8 pb-4 shrink-0 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01696f] opacity-50">Deep Dive: {stage.id.replace('_', ' ')}</span>
            <h2 className="text-2xl font-serif">{stage.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20}/></button>
        </div>

        <div className="px-8 pb-8 overflow-y-auto space-y-6 scrollbar-hide">
          {isLoading ? (
            <div className="flex flex-col gap-4 py-8">
              <div className="h-4 bg-black/5 rounded-full w-full animate-pulse" />
              <div className="h-4 bg-black/5 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-black/5 rounded-full w-1/2 animate-pulse" />
            </div>
          ) : style === 'concise' ? (
            <>
              <div className="p-5 bg-[#01696f]/5 rounded-3xl border border-[#01696f]/10">
                <p className="text-sm font-bold text-[#01696f] uppercase tracking-wider mb-2">Key Takeaway</p>
                <p className="text-lg font-serif italic leading-snug">{data.takeaway}</p>
              </div>
              <div className="space-y-4">
                {data.paragraphs.map((p: string, i: number) => (
                  <p key={i} className="text-base opacity-70 leading-relaxed">{p}</p>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4 pt-2">
              {data.sections.map((section: any, i: number) => (
                <details key={i} open={section.isDefaultOpen} className="group border-b border-black/5 pb-4 last:border-0">
                  <summary className="flex items-center justify-between cursor-pointer list-none py-3 hover:text-[#01696f] transition-colors">
                    <h4 className="font-bold text-sm uppercase tracking-widest">{section.title}</h4>
                    <ChevronDown size={18} className="opacity-40 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div 
                    className="text-base opacity-70 leading-relaxed pt-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </details>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 pt-4 shrink-0 bg-[#f7f6f2]/50 border-t border-black/5 flex gap-4">
          <button 
            onClick={() => { onClose(); onNext(); }}
            className="flex-1 py-4 bg-[#01696f] text-white rounded-2xl font-bold text-xs shadow-lg hover:shadow-xl transition-all"
          >
            Explore Next Stage
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function QuizCard({ stage, level, onDone, multiplier }: any) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [quizItem, setQuizItem] = useState<any>(null);

  useEffect(() => {
    const levelKey = level === 'wellversed' ? 'wellversed' : 'beginner';
    const questions = QUIZ_DATA[levelKey] || [];
    const stageId = stage?.id || '';
    
    // Attempt to find a question related to the stage, or fallback to index-based or first
    const stageQuestion = questions.find((q: any) => q.explanation.toLowerCase().includes(stageId.replace('_', ' '))) 
      || questions[0];

    setQuizItem(stageQuestion);
  }, [stage, level]);

  if (!quizItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-6 bg-black/10 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, duration: 0.6 * multiplier }}
        className="bg-white w-full max-w-lg p-8 rounded-t-[40px] shadow-2xl border-x border-t border-black/5 flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-[#d19900]" />
          <h3 className="font-bold text-xs uppercase tracking-[0.2em] opacity-40">Knowledge Check</h3>
        </div>
        
        <h4 className="text-2xl font-serif leading-tight">{quizItem.question}</h4>

        <div className="space-y-3">
          {quizItem.options.map((opt: string, i: number) => (
            <button
              key={i}
              disabled={answered}
              onClick={() => { setSelected(i); setAnswered(true); }}
              className={`w-full p-4 text-left rounded-2xl border-2 transition-all font-medium text-sm
                ${answered 
                  ? i === quizItem.correctIndex 
                    ? 'border-[#437a22] bg-[#437a22]/5 text-[#437a22]'
                    : i === selected 
                      ? 'border-[#a12c7b] bg-[#a12c7b]/5 text-[#a12c7b]'
                      : 'border-black/5 opacity-40'
                  : 'border-black/5 hover:border-[#01696f] hover:bg-[#01696f]/5'}`}
            >
              <div className="flex items-center justify-between">
                {opt}
                {answered && i === quizItem.correctIndex && <Check size={16} />}
                {answered && i === selected && i !== quizItem.correctIndex && <X size={16} />}
              </div>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {answered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-sm opacity-60 leading-relaxed italic border-l-2 border-[#d19900] pl-4">{quizItem.explanation}</p>
              <button 
                onClick={onDone}
                className="w-full py-4 bg-[#01696f] text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                Continue Race <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SettingsPanel({ state, setState, onClose }: { state: AppState, setState: any, onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#fdfdfb] z-[60] shadow-2xl flex flex-col border-l border-black/5"
      >
        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#01696f]/5 rounded-xl">
               <SettingsIcon size={20} className="text-[#01696f]" />
             </div>
             <h2 className="text-2xl font-serif font-bold">Preferences</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          {/* Experience Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
              <Activity size={12} /> Curriculum Level
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'beginner', label: 'Civic Novice' },
                { id: 'intermediate', label: 'Active Voter' },
                { id: 'wellversed', label: 'Constitutionalist' }
              ].map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => setState({ ...state, experienceLevel: lvl.id as any })}
                  className={`group p-4 flex items-center justify-between rounded-2xl border-2 transition-all ${state.experienceLevel === lvl.id ? 'border-[#01696f] bg-white shadow-md' : 'border-black/5 bg-white/50'}`}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${state.experienceLevel === lvl.id ? 'text-[#01696f]' : 'opacity-40'}`}>
                    {lvl.label}
                  </span>
                  {state.experienceLevel === lvl.id && <div className="w-2 h-2 bg-[#01696f] rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
              <Eye size={12} /> Visual Experience
            </h3>
            <div className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Motion Effects</p>
                  <p className="text-[10px] opacity-40">Animations and transitions</p>
                </div>
                <button 
                  onClick={() => setState({ ...state, reduceMotion: !state.reduceMotion })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${!state.reduceMotion ? 'bg-[#01696f]' : 'bg-black/10'}`}
                >
                  <motion.div 
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: !state.reduceMotion ? 24 : 0 }}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Quiz Mode</p>
                  <p className="text-[10px] opacity-40">Interactive checkpoints</p>
                </div>
                <button 
                  onClick={() => setState({ ...state, quizEnabled: !state.quizEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${state.quizEnabled ? 'bg-[#01696f]' : 'bg-black/10'}`}
                >
                  <motion.div 
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: state.quizEnabled ? 24 : 0 }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-black/5 bg-white">
          <button 
            onClick={() => { setState({ ...state, onboardingComplete: false, currentStageIndex: -1 }); onClose(); }}
            className="w-full py-4 bg-[#a12c7b]/5 text-[#a12c7b] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#a12c7b]/10 transition-colors"
          >
            <RotateCcw size={16} /> Reset Learning Journey
          </button>
        </div>
      </motion.div>
    </>
  );
}

function AssistantSidebar({ history, input, setInput, onSend, onClose, isLoading, chatEndRef, currentStage }: any) {
  const suggestions = useMemo(() => {
    if (!currentStage) return [
      "How do Indian elections work?",
      "What is the role of the ECI?",
      "How is the Prime Minister elected?"
    ];

    const defaults = [
      `Tell me more about ${currentStage.title}`,
      `Why is ${currentStage.title} important in India?`,
      `How does ${currentStage.title} work across different states?`
    ];

    if (currentStage.id === 'polling') return [...defaults, "What is a VVPAT?", "How do EVMs prevent fraud?"];
    if (currentStage.id === 'campaigning') return [...defaults, "What are MCC violations?", "How is campaign spending monitored?"];
    
    return defaults;
  }, [currentStage]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[60] shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-black/5 flex items-center justify-between bg-[#f7f6f2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#01696f] text-white flex items-center justify-center"><Megaphone size={20}/></div>
            <div>
              <h3 className="font-bold leading-none">Civic Researcher</h3>
              <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1 font-bold">Non-partisan Insight</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {history.length === 0 && (
            <div className="h-full flex flex-col space-y-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4 opacity-30 mt-10">
                <Vote size={48} />
                <p className="text-sm font-medium">Ask for depth on any constituency, <br/>MCC rule, or ECI procedure.</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Suggested Questions</h4>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => { setInput(s); }}
                      className="px-4 py-2 bg-[#f7f6f2] hover:bg-[#01696f]/5 border border-black/5 rounded-full text-xs font-medium transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {history.map((m: any, i: number) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-[#01696f] text-white rounded-tr-none' : 'bg-[#f7f6f2] text-[#28251d] rounded-tl-none font-medium shadow-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-4 bg-[#f7f6f2] rounded-2xl rounded-tl-none w-fit animate-pulse flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#01696f] rounded-full animate-bounce" style={{ animationDelay: '0s'}} />
                <div className="w-1.5 h-1.5 bg-[#01696f] rounded-full animate-bounce" style={{ animationDelay: '0.2s'}} />
                <div className="w-1.5 h-1.5 bg-[#01696f] rounded-full animate-bounce" style={{ animationDelay: '0.4s'}} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-8 border-t border-black/5">
          <div className="relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder="Ask for deeper nuance..."
              className="w-full bg-[#f7f6f2] border-none rounded-2xl pl-5 pr-14 py-4 text-sm focus:ring-2 focus:ring-[#01696f] transition-all"
            />
            <button 
              onClick={onSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-[#01696f] text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function DictionaryModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  
  const filtered = ELECTORAL_GLOSSARY.filter(item => 
    item.term.toLowerCase().includes(search.toLowerCase()) || 
    item.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/10 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl h-[70vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-black/5"
      >
        <div className="p-8 bg-[#f7f6f2] flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif">Electoral Dictionary</h2>
            <p className="text-xs opacity-40 font-bold uppercase tracking-widest mt-1">Foundational Terminology</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={24}/></button>
        </div>

        <div className="p-6 border-b border-black/5">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
            <input 
              type="text" 
              placeholder="Search terms or concepts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[#f7f6f2] rounded-2xl text-sm border-none focus:ring-2 focus:ring-[#01696f] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {filtered.length > 0 ? (
            filtered.map((item, i) => (
              <div key={i} className="group">
                <h3 className="text-lg font-serif font-bold text-[#01696f] transition-all group-hover:translate-x-2">{item.term}</h3>
                <p className="text-sm opacity-70 leading-relaxed mt-1">{item.definition}</p>
                <div className="h-px w-full bg-black/5 mt-6" />
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
              <Search size={48} />
              <p className="font-bold uppercase tracking-widest text-xs">No matches found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ExplanationBookModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/10 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-white w-full max-w-4xl h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-black/5"
      >
        <div className="p-10 bg-[#01696f] text-white flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-5xl font-serif">The Election Lifecycle</h2>
            <p className="text-xs opacity-60 font-bold uppercase tracking-[0.2em]">Comprehensive Documentation</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-16 scrollbar-hide">
          {ELECTION_STAGES.map((stage, i) => (
            <div key={stage.id} className="relative pl-12 border-l-2 border-[#01696f]/10">
              <div className="absolute left-[-13px] top-0 w-6 h-6 rounded-full bg-[#01696f] flex items-center justify-center text-white text-[10px] font-bold">
                {i + 1}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#01696f]/5 text-[#01696f] text-[10px] font-bold rounded-full uppercase tracking-wider">Stage {i+1}</span>
                  <h3 className="text-3xl font-serif font-bold">{stage.title}</h3>
                </div>
                <p className="text-lg opacity-80 leading-relaxed max-w-2xl font-serif italic">
                  {stage.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Core Objectives</h4>
                    <ul className="space-y-2 text-sm opacity-70">
                      <li>• Establishing candidate viability and platform clarity.</li>
                      <li>• Voter registration and awareness campaigns.</li>
                      <li>• Procedural verification of all ballots and tallies.</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Legal Framework</h4>
                    <p className="text-sm opacity-70 leading-relaxed">
                      Governed by the Constitution of India and the Representation of the People Act, ensuring the sanctity of the democratic process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 border-t border-black/5 flex justify-center">
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">Powered by CivicGuide Intelligence</p>
        </div>
      </motion.div>
    </div>
  );
}
