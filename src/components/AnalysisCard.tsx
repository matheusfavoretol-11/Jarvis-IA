import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, Zap, BrainCircuit, Target, Lightbulb, Play, Square } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { Analysis } from '../types';
import { voiceService } from '../services/voiceService';

interface AnalysisCardProps {
  analysis: Analysis;
  onFeedback: (id: string, type: 'helpful' | 'not-helpful') => void;
  isStreaming?: boolean;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, onFeedback, isStreaming }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleListen = () => {
    if (isSpeaking) {
      voiceService.stop();
      setIsSpeaking(false);
      return;
    }

    voiceService.speak({
      text: analysis.feedback || '',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-panel p-8 space-y-8"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[8px] font-mono tracking-[0.4em] text-white/20 uppercase">
          <div className="flex items-center gap-4">
            <span>{analysis.mode}_Protocol // Report_0x{analysis.id.slice(0, 4)}</span>
            {analysis.feedback && !isStreaming && (
              <button 
                onClick={handleListen}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full border transition-all active:scale-95",
                  isSpeaking 
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-500/80" 
                    : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/20"
                )}
              >
                {isSpeaking ? <Square className="w-2 h-2 fill-current" /> : <Play className="w-2 h-2 fill-current" />}
                <span>{isSpeaking ? 'Parar' : 'Ouvir'}</span>
              </button>
            )}
          </div>
          {isStreaming && <div className="flex items-center gap-2 text-white animate-pulse"><div className="w-1 h-1 bg-white rounded-full" /> Streaming_Data</div>}
        </div>
        <h2 className="text-white text-4xl leading-none font-black uppercase tracking-tighter">
          {analysis.mode === 'diagnostic' && 'Ad_Diagnostic'}
          {analysis.mode === 'spy' && 'Intel_Report'}
          {analysis.mode === 'genesis' && 'Creative_Output'}
        </h2>
      </header>

      <div className="space-y-8">
        <div className="prose prose-invert prose-sm max-w-none text-white/90 font-medium leading-relaxed prose-strong:text-white prose-p:mb-4 terminal-font text-[13px]">
          <ReactMarkdown>{analysis.feedback || 'Jarvis: Calibrating Neural Pathways...'}</ReactMarkdown>
        </div>

        {analysis.feedback && !isStreaming && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
            <div className="space-y-4">
               <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em] block">Performance_Probability</span>
               <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter leading-none">{analysis.rating}</span>
                  <span className="text-xl font-mono text-white/10">.0</span>
               </div>
               <div className="w-48 h-[1px] bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.rating * 10}%` }}
                    className="h-full bg-white/40"
                  />
               </div>
            </div>

            <div className="space-y-8">
               <div className="space-y-3">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em] block">Context_Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {analysis.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 text-[8px] font-mono uppercase tracking-[0.2em] text-white/30">
                        {tag}
                      </span>
                    ))}
                  </div>
               </div>

               <div className="flex items-center gap-4 pt-2">
                   <button 
                    onClick={() => onFeedback(analysis.id, 'helpful')}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-[9px] uppercase font-bold tracking-[0.2em] transition-all",
                      analysis.userFeedback === 'helpful' 
                        ? "bg-white/10 border-white/20 text-white" 
                        : "bg-transparent border-white/5 text-white/20 hover:border-white/20 hover:text-white/40"
                    )}
                  >
                    Helpful
                  </button>
                  <button 
                    onClick={() => onFeedback(analysis.id, 'not-helpful')}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-[9px] uppercase font-bold tracking-[0.2em] transition-all",
                      analysis.userFeedback === 'not-helpful' 
                        ? "bg-white/10 border-white/20 text-white" 
                        : "bg-transparent border-white/5 text-white/20 hover:border-white/20 hover:text-white/40"
                    )}
                  >
                    Not Helpful
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>

      <footer className="pt-8 border-t border-white/5 flex items-center justify-between">
         <div className="flex gap-4">
            <Share2 className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" />
         </div>
         <div className="text-[8px] opacity-10 tracking-[0.4em] font-mono uppercase">End_Log_Output</div>
      </footer>
    </motion.div>
  );
};
