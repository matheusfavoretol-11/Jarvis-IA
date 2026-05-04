import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface VoiceControllerProps {
  onCommand: (command: string) => void;
}

export function VoiceController({ onCommand }: VoiceControllerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript.toLowerCase();
        
        setTranscript(text);

        if (result.isFinal) {
          onCommand(text);
          setTimeout(() => setTranscript(''), 2000);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand, isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-mono text-white/40"
          >
            Jarvis_Hearing: "{transcript}"
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleListening}
        className={cn(
          "relative group p-3 rounded-full border transition-all duration-500",
          isListening 
            ? "bg-red-500/10 border-red-500/50 text-red-500" 
            : "bg-white/5 border-white/10 text-white/20 hover:text-white"
        )}
      >
        {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
        
        {/* Radar Effect when active */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping pointer-events-none" />
        )}
        
        {/* Tooltip */}
        <div className="absolute bottom-full mb-4 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/90 border border-white/10 px-4 py-2 rounded-lg text-[8px] uppercase tracking-[0.2em] whitespace-nowrap">
            <span className="text-white/40">Voice Control:</span> {isListening ? 'Active' : 'Disabled'}
          </div>
        </div>
      </button>
    </div>
  );
}
