import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, RotateCcw, BarChart2, Zap, Clock, Target, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import confetti from "canvas-confetti";

interface TypingResultsProps {
    wpm: number;
    accuracy: number;
    mistakes: number;
    wpmHistory: { time: number; wpm: number }[];
    onNextSnippet: () => void;
    onRetry: () => void;
}

export default function TypingResults({
    wpm,
    accuracy,
    mistakes,
    wpmHistory,
    onNextSnippet,
    onRetry
}: TypingResultsProps) {

  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const totalTime = wpmHistory.length > 0 ? wpmHistory[wpmHistory.length - 1].time : 0;

  return (
    <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-4">
        <div className="bg-card w-full max-w-4xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden relative">
            {/* Glossy gradient overlay */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Side: Stats */}
                <div className="lg:col-span-5 space-y-8 flex flex-col justify-center">
                    <div className="space-y-4 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary shadow-inner ring-1 ring-primary/20 mb-2 rotate-3 hover:rotate-6 transition-transform duration-500">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Complete!</h3>
                            <p className="text-muted-foreground font-medium mt-1">Great performance.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Zap className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">WPM</span>
                            </div>
                            <div className="text-4xl font-black text-foreground tracking-tighter group-hover:scale-105 origin-left transition-transform">{wpm}</div>
                        </div>
                        <div className="bg-muted/30 p-5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Target className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Accuracy</span>
                            </div>
                            <div className={`text-4xl font-black tracking-tighter group-hover:scale-105 origin-left transition-transform ${accuracy >= 95 ? 'text-green-500' : accuracy >= 90 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {accuracy}%
                            </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
                            </div>
                            <div className="text-xl font-bold text-foreground">{totalTime}s</div>
                        </div>
                         <div className="bg-muted/30 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Mistakes</span>
                            </div>
                            <div className={`text-xl font-bold ${mistakes > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>{mistakes}</div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Graph & Actions */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-8">
                     <div className="bg-muted/10 rounded-2xl border border-white/5 p-6 flex flex-col h-[280px]">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <BarChart2 className="w-3.5 h-3.5" /> Speed Trend
                            </p>
                            <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary/50" />
                                <span className="w-2 h-2 rounded-full bg-primary/20" />
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-[0]">
                             <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={wpmHistory}>
                                <defs>
                                    <linearGradient id="gradientWpm" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                                <Tooltip 
                                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--popover))', 
                                        borderColor: 'hsl(var(--border))', 
                                        borderRadius: '12px',
                                        padding: '8px 12px',
                                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' 
                                    }}
                                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold', fontSize: '14px' }}
                                    labelStyle={{ display: 'none' }}
                                    formatter={(value: number) => [`${value} WPM`, '']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="wpm" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={3} 
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--foreground))' }}
                                    fill="url(#gradientWpm)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <Button size="lg" className="flex-1 h-14 text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95" onClick={onNextSnippet}>
                            <Play className="w-5 h-5 mr-2 fill-current" />
                            Next Challenge
                        </Button>
                        <Button size="lg" variant="secondary" className="flex-1 h-14 text-base font-medium hover:bg-muted/80" onClick={onRetry}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
