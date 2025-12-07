import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, RotateCcw, BarChart2, Zap, Clock } from "lucide-react";
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
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-card/90 border shadow-2xl p-8 rounded-xl max-w-3xl w-full space-y-8 relative overflow-hidden">
            {/* Glossy gradient overlay */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full text-primary mb-2 shadow-inner ring-1 ring-primary/20">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Snippet Mastery Achieved</h3>
                <p className="text-muted-foreground font-medium">Your coding rhythm is on point.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/40 p-4 rounded-xl border hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Zap className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Net WPM</span>
                            </div>
                            <div className="text-4xl font-black text-foreground tracking-tight">{wpm}</div>
                        </div>
                        <div className="bg-muted/40 p-4 rounded-xl border hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <BarChart2 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
                            </div>
                            <div className={`text-4xl font-black tracking-tight ${accuracy >= 95 ? 'text-green-500' : accuracy >= 90 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {accuracy}%
                            </div>
                        </div>
                         <div className="bg-muted/40 p-4 rounded-xl border hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Time</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">{totalTime}s</div>
                        </div>
                        <div className="bg-muted/40 p-4 rounded-xl border hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider">Mistakes</span>
                            </div>
                            <div className="text-2xl font-bold text-red-500">{mistakes}</div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20" onClick={onNextSnippet}>
                            <Play className="w-5 h-5 mr-2" />
                            Next Snippet
                        </Button>
                        <Button variant="outline" className="flex-1 h-12 text-base" onClick={onRetry}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </div>
                
                {/* WPM Chart */}
                <div className="bg-muted/20 rounded-xl border p-4 flex flex-col min-h-[250px]">
                    <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Performance Trend
                    </p>
                    <div className="flex-1 w-full min-h-[0]">
                         <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={wpmHistory}>
                            <defs>
                                <linearGradient id="gradientWpm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--popover))', 
                                    borderColor: 'hsl(var(--border))', 
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                                }}
                                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                                labelStyle={{ display: 'none' }}
                                formatter={(value: number) => [`${value} WPM`, 'Speed']}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="wpm" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={3} 
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                                fill="url(#gradientWpm)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
