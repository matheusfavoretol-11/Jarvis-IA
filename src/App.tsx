import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Cpu,
  LayoutDashboard,
  Eye,
  Lightbulb,
  History as HistoryIcon,
  Search,
  Activity,
  Trash2,
  Mic
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { UploadZone } from './components/UploadZone';
import { AnalysisCard } from './components/AnalysisCard';
import { StatsView } from './components/StatsView';
import { WelcomeScreen } from './components/WelcomeScreen';
import { VoiceController } from './components/VoiceController';
import { Analysis } from './types';
import { cn } from './lib/utils';

// Lazy initialization to avoid crash if key is missing on load
let aiInstance: any = null;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('CONFIG_ERROR: A chave GEMINI_API_KEY não foi detectada no ambiente.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

type Tab = 'dashboard' | 'analyze' | 'history' | 'ideas' | 'spy';

export default function App() {
  const [history, setHistory] = useState<Analysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [competitorInfo, setCompetitorInfo] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('jarvis_history');
    if (saved) setHistory(JSON.parse(saved));

    const welcomeVisited = localStorage.getItem('jarvis_welcome_visited');
    setShowWelcome(welcomeVisited !== 'true');
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('jarvis_history', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = useCallback(async () => {
    if ((activeTab !== 'ideas' && selectedFiles.length === 0) || isLoading) return;

    setIsLoading(true);
    const mode = activeTab === 'spy' ? 'spy' : activeTab === 'ideas' ? 'genesis' : 'diagnostic';
    
    // Create placeholder
    const newAnalysis: Analysis = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      mode,
      files: selectedFiles.map(f => ({ name: f.file.name, type: f.file.type, preview: f.preview })),
      feedback: '',
      rating: 0,
      tags: [],
    };
    setCurrentAnalysis(newAnalysis);

    try {
      const parts: any[] = [];
      
      if (selectedFiles.length > 0) {
        await Promise.all(selectedFiles.map(async (fileObj) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(fileObj.file);
          });

          parts.push({
            inlineData: {
              data: base64.split(',')[1],
              mimeType: fileObj.file.type
            }
          });
        }));
      }

      let systemPrompt = '';
      if (activeTab === 'spy') {
        systemPrompt = `Protocolo: SPY_CONCORRÊNCIA.
                        Concorrente: ${competitorInfo || 'Não especificado'}.
                        Você é o Jarvis. O Favoreto enviou criativos ou contexto da CONCORRÊNCIA.
                        Sua missão:
                        1. Desconstruir a estratégia de vendas (oferta, precificação, gatilhos).
                        2. Identificar pontos fortes que estão convertendo.
                        3. Expor as falhas e onde eles estão perdendo dinheiro.
                        4. Listar 3 passos exatos para o Favoreto "roubar" essa audiência com um anúncio melhor.
                        5. Nota de 0 a 10 (Format: NOTA: X/10) baseada na escala atual deles.
                        Informações adicionais: ${userMessage || 'Nenhuma'}.
                        Seja impiedoso e focado em lucro.`;
      } else if (activeTab === 'ideas') {
        systemPrompt = `Protocolo: STRATEGIC_GENESIS.
                        Produto/Serviço: ${productDetails || 'Performance Ads'}.
                        Contexto/Público: ${userMessage || 'Nenhum'}.
                        Benchmark/Mercado: ${competitorInfo || 'Não especificado'}.
                        
                        Você é o Jarvis, o Estrategista de Growth #1 do Favoreto. Sua missão não é apenas dar ideias, mas criar uma VANTAGEM COMPETITIVA DESLEAL.
                        
                        Sua análise deve seguir estes pilares:
                        1. ANÁLISE DE LACUNA (Gap Analysis): O que os concorrentes (${competitorInfo}) estão fazendo de errado ou de forma genérica? Onde eles estão "deixando dinheiro na mesa"?
                        2. PADRÕES DE SUCESSO: Identifique 3 ganchos (Hooks) de alta retenção baseados em comportamentos de compra reais no nicho.
                        3. ESTRATÉGIA DE DIFERENCIAÇÃO: Como o Favoreto pode se posicionar como a única solução óbvia, tornando a concorrência irrelevante.
                        4. ROTEIROS DE ALTA PERFORMANCE: Crie 2 roteiros (um direto ao ponto e um narrativo/storytelling) focados em quebra de objeções e desejo imediato.
                        5. O QUE NÃO FAZER: Liste 3 erros comuns que matam o ROI nesse nicho específico.
                        6. NOTA E POTENCIAL: Nota de 0 a 10 (Format: NOTA: X/10) de probabilidade de escala imediata.
                        
                        Seja estratégico, ignore o óbvio. Foque em psicologia de vendas e escala agressiva.`;
      } else {
        systemPrompt = `Protocolo: DIAGNOSTIC_CORE.
                        Você é o Jarvis, assistente técnico de performance para o Favoreto.
                        Missão: Analisar criativos enviados e dar feedback brutalmente honesto.
                        1. Nota de 0 a 10 (Format: NOTA: X/10).
                        2. Feedback sem filtros.
                        3. O que mudar imediatamente.
                        4. Sugestão de melhoria técnica.
                        Informações adicionais: ${userMessage || 'Nenhuma'}.`;
      }

      parts.push({
        text: systemPrompt + ` Sempre chame o usuário de "Favoreto". Use tom futurista, minimalista e focado em lucro.`
      });

      const ai = getAI();
      let result: any;
      try {
        result = await ai.models.generateContentStream({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts }],
        });
      } catch (e: any) {
        console.error("Jarvis Strategic Error:", e);
        throw new Error(`Jarvis: Falha na calibração estratégica. ${e.message || 'Conexão instável.'}`);
      }

      let streamedFeedback = '';
      
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          streamedFeedback += text;
          const ratingMatch = streamedFeedback.match(/(?:NOTA:\s*)?(\d+(?:\.\d+)?)\s*\/\s*10/i);
          const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
          setCurrentAnalysis(prev => prev ? { 
            ...prev, 
            feedback: streamedFeedback,
            rating: rating || prev.rating
          } : null);
        }
      }

      if (!streamedFeedback) {
        streamedFeedback = "Jarvis: Conexão interrompida. Não foi possível extrair insights estratégicos desta vez. Por favor, ajuste o briefing e tente novamente.";
      }

      const ratingMatch = streamedFeedback.match(/(?:NOTA:\s*)?(\d+(?:\.\d+)?)\s*\/\s*10/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 7.5;
      
      const finalAnalysis = { 
        ...newAnalysis, 
        feedback: streamedFeedback, 
        rating, 
        tags: [activeTab.toUpperCase(), 'AUTO_GEN']
      };
      
      setHistory(prev => [finalAnalysis, ...prev]);
      setCurrentAnalysis(finalAnalysis);
      setSelectedFiles([]);
      setUserMessage('');
      
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedFiles, isLoading, competitorInfo, userMessage, productDetails]);

  const handleFeedback = (id: string, type: 'helpful' | 'not-helpful') => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, userFeedback: type } : item));
    if (currentAnalysis?.id === id) {
      setCurrentAnalysis(prev => prev ? { ...prev, userFeedback: type } : null);
    }
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentAnalysis?.id === id) setCurrentAnalysis(null);
  };

  const handleVoiceCommand = useCallback((cmd: string) => {
    const text = cmd.toLowerCase();
    
    // Navigation
    if (text.includes('dashboard') || text.includes('início')) {
      setActiveTab('dashboard');
      setCurrentAnalysis(null);
    } else if (text.includes('analisar') || text.includes('análise')) {
      setActiveTab('analyze');
      setCurrentAnalysis(null);
    } else if (text.includes('histórico')) {
      setActiveTab('history');
      setCurrentAnalysis(null);
    } else if (text.includes('ideias') || text.includes('ideia')) {
      setActiveTab('ideas');
      setCurrentAnalysis(null);
    } else if (text.includes('concorrência') || text.includes('espionar')) {
      setActiveTab('spy');
      setCurrentAnalysis(null);
    }

    // Actions
    if (text.includes('iniciar') || text.includes('executar') || text.includes('processar') || text.includes('go')) {
      handleAnalyze();
    }
  }, [activeTab, handleAnalyze]);

  const avgScore = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.rating, 0) / history.length).toFixed(1)
    : '0';

  if (showWelcome === null) return <div className="h-screen bg-black" />;

  return (
    <div className="bg-black">
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <WelcomeScreen key="welcome" onEnter={() => setShowWelcome(false)} />
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="flex h-screen bg-black text-white overflow-hidden selection:bg-white selection:text-black"
          >
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-white/5 flex flex-col shrink-0 bg-[#050505]">
        <div className="p-8 pb-12">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase">Jarvis</h1>
          </div>
          <p className="text-[8px] text-white/20 font-mono tracking-widest uppercase">Meta Ads AI Expert</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <p className="px-4 text-[9px] text-white/5 uppercase tracking-[0.3em] font-mono mb-4">Navegação</p>
          
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setCurrentAnalysis(null); }}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
          />
          <NavButton 
            active={activeTab === 'analyze'} 
            onClick={() => { setActiveTab('analyze'); setCurrentAnalysis(null); }}
            icon={<Zap className="w-4 h-4" />}
            label="Analisar"
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => { setActiveTab('history'); setCurrentAnalysis(null); }}
            icon={<HistoryIcon className="w-4 h-4" />}
            label="Histórico"
          />
          <NavButton 
            active={activeTab === 'ideas'} 
            onClick={() => { setActiveTab('ideas'); setCurrentAnalysis(null); }}
            icon={<Lightbulb className="w-4 h-4" />}
            label="Ideias"
          />
          <NavButton 
            active={activeTab === 'spy'} 
            onClick={() => { setActiveTab('spy'); setCurrentAnalysis(null); }}
            icon={<Search className="w-4 h-4" />}
            label="Concorrência"
          />
        </nav>

        <div className="p-8 mt-auto border-t border-white/5">
           <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-[8px] text-white/20 uppercase tracking-widest">
                 <span>System_Load</span>
                 <span className="text-green-500">Optimal</span>
              </div>
              <div className="h-[2px] bg-white/5 w-full">
                 <div className="h-full bg-white/40 w-1/3"></div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#020202]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-12 shrink-0">
          <div className="flex items-center gap-4">
             <Activity className="w-4 h-4 text-white/20" />
             <h2 className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-mono">
               Workspace // {activeTab.toUpperCase()}
             </h2>
          </div>

          <div className="flex items-center gap-8">
            <VoiceController onCommand={handleVoiceCommand} />
            <div className="flex gap-12">
               <div className="text-right">
                  <p className="text-[8px] text-white/20 uppercase tracking-widest font-mono">Análises</p>
                  <p className="text-xs font-bold font-mono">{history.length}</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] text-white/20 uppercase tracking-widest font-mono">Score Médio</p>
                  <p className="text-xs font-bold font-mono">{avgScore}</p>
               </div>
            </div>
            <div className="h-8 w-[1px] bg-white/5" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest">Online</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <ViewLayout key="dashboard" title="Performance Hub">
                   <StatsView history={history} />
                </ViewLayout>
              )}

              {activeTab === 'history' && (
                <ViewLayout key="history" title="Neural Records">
                   {history.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => { setActiveTab('analyze'); setCurrentAnalysis(item); }}
                            className="glass-panel p-6 cursor-pointer hover:border-white/20 transition-all group relative overflow-hidden"
                          >
                             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-2xl font-black">$</div>
                             <div className="flex justify-between items-start mb-4">
                                <span className="text-[8px] px-2 py-1 bg-white/5 border border-white/10 text-white/40 font-mono uppercase">
                                  {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                                <span className="text-sm font-black text-white">{item.rating}</span>
                             </div>
                             <p className="text-xs font-bold text-white/50 mb-4 uppercase truncate">{item.files[0]?.name || 'Analysis'}</p>
                             <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                  {item.tags.slice(0, 2).map(t => (
                                    <span key={t} className="text-[7px] text-white/20 uppercase font-mono">#{t}</span>
                                  ))}
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-500 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="glass-panel p-24 flex flex-col items-center justify-center text-center space-y-6">
                        <Activity className="w-12 h-12 text-white/5 animate-pulse" />
                        <div className="space-y-2">
                          <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-mono">No_Data_Detected</p>
                          <p className="text-white/40 text-sm max-w-sm">O Jarvis está aguardando o primeiro input de dados para catalogar em sua rede neural.</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('analyze')}
                          className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white hover:border-white/20 transition-all"
                        >
                          Iniciar Primeira Análise
                        </button>
                     </div>
                   )}
                </ViewLayout>
              )}

              {(activeTab === 'analyze' || activeTab === 'ideas' || activeTab === 'spy') && (
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-12"
                >
                  {currentAnalysis ? (
                    <div className="space-y-8">
                      <button 
                        onClick={() => setCurrentAnalysis(null)}
                        className="text-[10px] text-white/20 uppercase tracking-widest font-bold hover:text-white"
                      >
                        {'<'} Back_To_Input
                      </button>
                      <AnalysisCard 
                        analysis={currentAnalysis}
                        onFeedback={handleFeedback}
                        isStreaming={isLoading}
                      />
                    </div>
                  ) : (
                    <div className="space-y-16">
                      <div className="space-y-2">
                        <h2 className="text-5xl font-black uppercase tracking-tighter">
                          {activeTab === 'analyze' && 'Nova Análise'}
                          {activeTab === 'ideas' && 'Creative Genesis'}
                          {activeTab === 'spy' && 'Market Infiltration'}
                        </h2>
                        <p className="text-xs text-white/30 uppercase tracking-widest max-w-2xl">
                          {activeTab === 'analyze' && 'Anexa o criativo. Quanto mais contexto, mais cirúrgico eu sou.'}
                          {activeTab === 'ideas' && 'Gerador de conceitos disruptivos para escala imediata e lucro exponencial.'}
                          {activeTab === 'spy' && 'Descontrua a estratégia da concorrência e descubra o que realmente imprime dinheiro.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-12">
                          {activeTab === 'analyze' && (
                             <UploadZone onFilesSelected={setSelectedFiles} isLoading={isLoading} />
                          )}

                          {activeTab === 'spy' && (
                            <div className="space-y-4">
                              <label className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">Concorrente (URL ou Nome)</label>
                              <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input 
                                  value={competitorInfo}
                                  onChange={(e) => setCompetitorInfo(e.target.value)}
                                  placeholder="Ex: ConcorrenteX.com"
                                  className="w-full bg-white/[0.01] border border-white/5 rounded-2xl p-6 pl-14 text-xs text-white focus:outline-none focus:border-white/20 transition-all font-mono"
                                />
                              </div>
                              <UploadZone onFilesSelected={setSelectedFiles} isLoading={isLoading} />
                            </div>
                          )}

                          {activeTab === 'ideas' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-4">
                                 <label className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">Produto / Serviço</label>
                                 <input 
                                    value={productDetails}
                                    onChange={(e) => setProductDetails(e.target.value)}
                                    placeholder="Ex: Mentoria de Marketing Digital"
                                    className="w-full bg-white/[0.01] border border-white/5 rounded-2xl p-6 text-xs text-white focus:outline-none focus:border-white/20 transition-all font-mono"
                                  />
                               </div>
                               <div className="space-y-4">
                                 <label className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">Benchmarks / Concorrentes</label>
                                 <input 
                                    value={competitorInfo}
                                    onChange={(e) => setCompetitorInfo(e.target.value)}
                                    placeholder="Ex: Player X, Produto Y..."
                                    className="w-full bg-white/[0.01] border border-white/5 rounded-2xl p-6 text-xs text-white focus:outline-none focus:border-white/20 transition-all font-mono"
                                  />
                               </div>
                             </div>
                          )}
                          
                          <div className="space-y-4">
                            <label className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">
                              {activeTab === 'spy' ? 'O que eles estão fazendo?' : activeTab === 'ideas' ? 'Público & Objetivo' : 'Contexto Profundo (Briefing)'}
                            </label>
                            <textarea 
                              value={userMessage}
                              onChange={(e) => setUserMessage(e.target.value)}
                              placeholder={activeTab === 'ideas' ? "Ex: Homens 25-45 interessados em escala de anúncios..." : "Ex: nicho, oferta, promessa, público, canais..."}
                              className="w-full bg-white/[0.01] border border-white/5 rounded-2xl p-8 text-xs text-white focus:outline-none focus:border-white/20 transition-all min-h-[160px] font-mono leading-relaxed placeholder:opacity-5"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col justify-end">
                          <button
                            onClick={handleAnalyze}
                            disabled={isLoading || (activeTab !== 'ideas' && selectedFiles.length === 0)}
                            className="w-full py-8 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 font-bold text-xs uppercase tracking-[0.4em] transition-all disabled:opacity-5 active:scale-95 relative overflow-hidden"
                          >
                            <span className="relative z-10">{isLoading ? 'Processing...' : activeTab === 'analyze' ? 'Initialize_Scan' : activeTab === 'ideas' ? 'Start_Genesis' : 'Begin_Spying'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-300 group",
        active 
          ? "bg-white/[0.04] border border-white/10 text-white" 
          : "text-white/20 hover:text-white/40"
      )}
    >
      <div className={cn(
        "transition-transform duration-300 group-hover:scale-105",
        active ? "text-white/80" : "text-white/10"
      )}>
        {icon}
      </div>
      <span className="text-[10px] uppercase tracking-widest font-medium">{label}</span>
    </button>
  );
}

function ViewLayout({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-12"
    >
      <div className="space-y-2">
        <h2 className="text-5xl font-black uppercase tracking-tighter">{title}</h2>
        <div className="w-12 h-[2px] bg-white/20" />
      </div>
      {children}
    </motion.div>
  );
}
