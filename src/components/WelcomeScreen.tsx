import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { voiceService } from '../services/voiceService';

interface WelcomeScreenProps {
  onEnter: () => void;
  userName?: string;
}

export function WelcomeScreen({ onEnter, userName = 'Matheus' }: WelcomeScreenProps) {
  const [text, setText] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(voiceService.getAudioEnabled());
  const [hasStartedVoice, setHasStartedVoice] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const voiceTriggerRef = useRef(false);
  
  const fullText = `O que temos para hoje, ${userName}?`;

  // Typewriter effect with more natural pacing
  useEffect(() => {
    if (!isAwake) return;
    
    let index = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, index + 1));
      index++;
      if (index >= fullText.length) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [fullText, isAwake]);

  const speak = useCallback(async () => {
    if (!isAudioEnabled || voiceTriggerRef.current) return;
    
    // Check if played in the last 10 minutes to avoid annoyance on refresh
    const lastSession = localStorage.getItem('jarvis_last_voice_session');
    const now = Date.now();
    if (lastSession && now - parseInt(lastSession) < 600000) {
      voiceTriggerRef.current = true;
      setHasStartedVoice(true);
      return;
    }

    await voiceService.speak({
      text: fullText,
      onStart: () => {
        voiceTriggerRef.current = true;
        setHasStartedVoice(true);
        localStorage.setItem('jarvis_last_voice_session', Date.now().toString());
      }
    });
  }, [fullText, isAudioEnabled]);

  // Autoplay Workaround: Trigger on first movement or click
  useEffect(() => {
    const wakeUp = () => {
      if (!isAwake) {
        setIsAwake(true);
        setTimeout(speak, 800);
      }
    };

    window.addEventListener('mousemove', wakeUp, { once: true });
    window.addEventListener('click', wakeUp, { once: true });
    window.addEventListener('scroll', wakeUp, { once: true });

    return () => {
      window.removeEventListener('mousemove', wakeUp);
      window.removeEventListener('click', wakeUp);
      window.removeEventListener('scroll', wakeUp);
      voiceService.stop();
    };
  }, [speak, isAwake]);

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !isAudioEnabled;
    setIsAudioEnabled(newValue);
    voiceService.setAudioEnabled(newValue);
  };

  const handleStart = () => {
    localStorage.setItem('jarvis_welcome_visited', 'true');
    onEnter();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020105] flex flex-col items-center justify-center overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.15),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(147,51,234,0.1),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.1),transparent_40%)]" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-soft-light" 
           style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      {/* Decorative Floating Elements */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-12 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Top Bar HUD */}
      <div className="absolute top-8 left-12 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] text-white/20 font-mono tracking-[0.4em] uppercase">Jarvis_System_Online</span>
        </div>
        <div className="h-[1px] w-24 bg-white/5" />
        <div className="flex items-center gap-3 text-white/20 font-mono text-[8px] tracking-widest">
           <Cpu className="w-3 h-3" />
           V3.0_NEURAL_CORE
        </div>
      </div>

      <div className="absolute top-8 right-12">
        <button 
          onClick={toggleAudio}
          className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl text-white/40 hover:text-white hover:border-white/20 transition-all group"
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Initial Interaction Overlay (Invisible but captures first event) */}
      {!isAwake && (
        <div className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 0.4 }}
             className="text-[10px] text-white/20 uppercase tracking-[1em] animate-pulse"
           >
             Mova o mouse ou clique para despertar
           </motion.div>
        </div>
      )}

      {/* Center Content */}
      <div className="relative z-10 text-center space-y-16 max-w-5xl px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
          animate={isAwake ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="flex justify-center mb-12">
            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" 
              />
              <div className="relative w-20 h-20 rounded-3xl border border-white/10 flex items-center justify-center bg-white/[0.03] backdrop-blur-2xl">
                 <Sparkles className="w-8 h-8 text-blue-400/80 animate-pulse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-tight min-h-[1.5em] flex items-center justify-center">
            {text}
            <motion.span 
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-1 h-16 bg-blue-500 ml-4 rounded-full" 
            />
          </h1>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isAwake ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 2.2 }}
            className="flex flex-col items-center gap-4"
          >
             <p className="text-[11px] uppercase tracking-[0.8em] text-white/40 font-mono">
               Seu hub de performance inteligente
             </p>
             <div className="h-[1px] w-12 bg-white/10" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isAwake ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 2.8 }}
        >
          <button
            onClick={handleStart}
            className="group relative px-12 py-4 rounded-xl overflow-hidden transition-all duration-500 active:scale-95"
          >
            {/* Minimal Border */}
            <div className="absolute inset-0 border border-white/10 group-hover:border-white/30 transition-all rounded-xl" />
            
            <span className="relative z-10 text-white/40 font-medium text-[10px] uppercase tracking-[0.6em] transition-colors group-hover:text-white">
              Entrar no Hub
            </span>
          </button>
        </motion.div>
      </div>

      {/* Metadata Hud Footer */}
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center text-white/5 font-mono text-[8px] tracking-[0.3em] uppercase">
        <div className="flex gap-8">
           <span>Lat: 23.5505 S</span>
           <span>Long: 46.6333 W</span>
        </div>
        <div className="text-right">
           <span>Status: Authenticated</span>
        </div>
      </div>
    </div>
  );
}
