import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface WelcomeScreenProps {
  onEnter: () => void;
  userName?: string;
}

export function WelcomeScreen({ onEnter, userName = 'Matheus' }: WelcomeScreenProps) {
  const [text, setText] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('jarvis_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [hasStartedVoice, setHasStartedVoice] = useState(false);
  const fullText = `O que temos para hoje, ${userName}?`;

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, index + 1));
      index++;
      if (index >= fullText.length) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [fullText]);

  // Voice effect
  const speak = useCallback(() => {
    if (!isAudioEnabled || hasStartedVoice) return;
    
    // Small delay to sync with visual typing or ensure user interaction context
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9; // Slightly slower for "intelligent/calm" feel
      utterance.pitch = 0.8; // Lower pitch for "masculine/confident" feel
      
      // Find a good Portuguese voice if available
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.includes('pt-BR')) || voices.find(v => v.lang.includes('pt'));
      if (ptVoice) utterance.voice = ptVoice;
      
      window.speechSynthesis.speak(utterance);
      setHasStartedVoice(true);
    }, 800);
  }, [fullText, isAudioEnabled, hasStartedVoice]);

  useEffect(() => {
    // Chrome and other browsers require user interaction to play audio. 
    // We'll try to speak, but it might only work after the user clicks anywhere or the button.
    // However, the prompt asks for "automatic" - we'll do our best.
    const handleInitialVoice = () => {
      speak();
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      handleInitialVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = handleInitialVoice;
    }

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, [speak]);

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !isAudioEnabled;
    setIsAudioEnabled(newValue);
    localStorage.setItem('jarvis_sound_enabled', JSON.stringify(newValue));
    if (!newValue) window.speechSynthesis.cancel();
  };

  const handleStart = () => {
    localStorage.setItem('jarvis_welcome_visited', 'true');
    onEnter();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(60,20,120,0.15),transparent_70%)] animate-pulse" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
      
      {/* HUD Elements */}
      <div className="absolute top-12 left-12 flex items-center gap-4 text-white/20 font-mono text-[10px] tracking-[0.4em] uppercase">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
        Neural_Link_Established
      </div>

      <div className="absolute top-12 right-12">
        <button 
          onClick={toggleAudio}
          className="p-4 rounded-full border border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:border-white/20 transition-all group"
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Center Content */}
      <div className="relative text-center space-y-12 max-w-4xl px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
              <Sparkles className="w-12 h-12 text-blue-400 relative z-10 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-tight h-[1.2em]">
            {text}<span className="inline-block w-2 h-12 bg-white ml-2 animate-pulse align-middle" />
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="text-xs uppercase tracking-[0.6em] text-white/30 font-mono"
          >
            Seu hub de performance inteligente
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
        >
          <button
            onClick={handleStart}
            className="group relative px-12 py-5 bg-white text-black font-black text-xl uppercase tracking-[0.4em] overflow-hidden hover:scale-105 transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10">Entrar no Hub</span>
          </button>
        </motion.div>
      </div>

      {/* Decorative Orbs */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
    </div>
  );
}
