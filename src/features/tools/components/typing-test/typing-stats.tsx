import React, { useEffect, useState } from "react";
import { Zap, Target, AlertCircle } from "lucide-react";

export default function TypingStats({ wpm, accuracy, mistakes }: { wpm: number; accuracy: number; mistakes: number }) {
  // Animate values
  const [displayWpm, setDisplayWpm] = useState(wpm);
  
  useEffect(() => {
    setDisplayWpm(wpm);
  }, [wpm]);

  return (
    <div className="flex gap-3 sm:gap-6 bg-background/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-lg">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <div className="flex flex-col leading-none">
            <span className="text-xxs uppercase font-bold text-muted-foreground tracking-wider">Speed</span>
            <span className="text-xl font-bold font-mono text-foreground min-w-[3ch]">{displayWpm}</span>
        </div>
      </div>
      
      <div className="w-px bg-border/50 h-8 self-center" />
      
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-blue-500" />
        <div className="flex flex-col leading-none">
             <span className="text-xxs uppercase font-bold text-muted-foreground tracking-wider">Acc</span>
             <span className={`text-xl font-bold font-mono min-w-[4ch] ${accuracy < 90 ? 'text-yellow-500' : 'text-foreground'}`}>
              {accuracy}%
            </span>
        </div>
      </div>

      <div className="w-px bg-border/50 h-8 self-center" />

      <div className="flex items-center gap-2">
        <AlertCircle className={`w-4 h-4 ${mistakes > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
        <div className="flex flex-col leading-none">
            <span className="text-xxs uppercase font-bold text-muted-foreground tracking-wider">Err</span>
            <span className={`text-xl font-bold font-mono min-w-[2ch] ${mistakes > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {mistakes}
            </span>
        </div>
      </div>
    </div>
  );
}






