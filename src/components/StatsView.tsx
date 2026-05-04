import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Analysis } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, Award, Clock, Hash } from 'lucide-react';

interface StatsViewProps {
  history: Analysis[];
}

export const StatsView: React.FC<StatsViewProps> = ({ history }) => {
  if (history.length === 0) return null;

  const chartData = history.slice(-10).map(item => ({
    name: new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    score: item.rating
  }));

  const tagCounts: Record<string, number> = {};
  history.forEach(item => {
    item.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const averageRating = (history.reduce((acc, curr) => acc + curr.rating, 0) / history.length).toFixed(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-panel p-12 lg:col-span-2 space-y-12"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-editorial text-sm tracking-[0.4em] opacity-40 uppercase">
            Evolution_Pulse
          </h3>
          <span className="text-[10px] text-white/10 font-mono tracking-widest">N10_SAMPLE_SIZE</span>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fff" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={true} horizontal={false} />
              <XAxis 
                dataKey="name" 
                stroke="#ffffff10" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={20}
              />
              <YAxis 
                stroke="#ffffff10" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                domain={[0, 10]} 
                dx={-20}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#000', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontFamily: 'monospace',
                  padding: '20px'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="stepAfter" 
                dataKey="score" 
                stroke="#fff" 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                strokeWidth={2}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-panel p-12 flex flex-col justify-between"
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <h3 className="text-[10px] tracking-[0.4em] opacity-40 uppercase font-bold text-white/50">
              Metric_Consolidation
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white tracking-tighter leading-none">{averageRating}</span>
              <span className="text-white/10 text-[10px] font-black italic uppercase">AVG_SCORE</span>
            </div>
          </div>
          
          <div className="space-y-6 pt-8 border-t border-white/5">
            <div className="flex items-center justify-between text-[8px] font-mono text-white/10 uppercase tracking-[0.4em]">
              <span>Neural_Activity</span>
              <span>Density_0x</span>
            </div>
            <div className="space-y-3">
              {topTags.map((tag, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-default">
                  <span className="text-[10px] text-white/30 group-hover:text-white transition-colors uppercase font-bold tracking-widest font-mono">
                    {tag.tag}
                  </span>
                  <div className="flex-1 border-b border-white/[0.02] mx-4" />
                  <span className="text-[10px] font-black text-white/50">
                    {tag.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex items-center justify-between text-[10px] text-white/10 font-mono uppercase border-t border-white/5 pt-8">
           <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
              <span>Status: Optimal</span>
           </div>
           <span>2024_REVISION</span>
        </div>
      </motion.div>
    </div>
  );
};
