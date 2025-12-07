import React, { useEffect, useState } from "react";
import { Snippet } from "../_data/snippets";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Keyboard as KeyboardIcon, MousePointerClick, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TypingAreaProps {
  currentSnippet: Snippet | null;
  userInput: string;
  isFocused: boolean;
  isFinished: boolean;
  mistakes: number;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  codeContainerRef: React.RefObject<HTMLDivElement | null>;
  cursorRef: React.RefObject<HTMLSpanElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleFocus: () => void;
  handleBlur: () => void;
  resetGame: () => void;
  requestFocus: () => void;
}

export default function TypingArea({
  currentSnippet,
  userInput,
  isFocused,
  isFinished,
  mistakes,
  inputRef,
  codeContainerRef,
  cursorRef,
  handleInputChange,
  handleKeyDown,
  handleFocus,
  handleBlur,
  resetGame,
  requestFocus
}: TypingAreaProps) {

  const [shake, setShake] = useState(false);

  // Trigger shake on mistake increase
  useEffect(() => {
    if (mistakes > 0) {
        setShake(true);
        const timer = setTimeout(() => setShake(false), 400);
        return () => clearTimeout(timer);
    }
  }, [mistakes]);

  const renderCode = () => {
    if (!currentSnippet) return null;

    const code = currentSnippet.code;
    const result = [];
    
    for (let i = 0; i < code.length; i++) {
      let className = "text-muted-foreground opacity-40"; 
      let char = code[i];
      let isCursor = i === userInput.length;
      
      if (i < userInput.length) {
        if (userInput[i] === char) {
          className = "text-foreground font-medium"; 
        } else {
          className = "text-red-500 bg-red-500/10 rounded-sm";
        }
      }
      
      result.push(
        <span 
            key={i} 
            ref={isCursor ? cursorRef : null}
            className={`
                ${className} 
                font-mono text-lg transition-colors duration-75 relative
            `}
        >
          {char}
          {isCursor && isFocused && (
            <motion.div
                layoutId="cursor"
                className="absolute -left-[1px] -top-0.5 -bottom-0.5 w-[2px] bg-primary z-10"
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{
                    opacity: {
                        duration: 1,
                        repeat: Infinity,
                        times: [0, 0.5, 0.5, 1],
                        ease: "linear"
                    },
                    layout: {
                        type: "spring",
                        stiffness: 500,
                        damping: 28
                    }
                }}
            />
          )}
        </span>
      );
    }
    
    // Trailing cursor if at end
    if (userInput.length === code.length) {
         result.push(
            <span key="end" ref={cursorRef} className="relative inline-block align-middle ml-[1px] h-6 w-2">
                {isFocused && (
                     <motion.div
                        layoutId="cursor"
                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary z-10"
                        animate={{ opacity: [1, 1, 0, 0] }}
                        transition={{
                            opacity: {
                                duration: 1,
                                repeat: Infinity,
                                times: [0, 0.5, 0.5, 1],
                                ease: "linear"
                            },
                             layout: {
                                type: "spring",
                                stiffness: 500,
                                damping: 28
                            }
                        }}
                    />
                )}
            </span>
         );
    }
    
    return result;
  };

  return (
    <motion.div
        animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
    >
      <Card className={`relative overflow-hidden border-0 shadow-2xl min-h-[450px] flex flex-col transition-all duration-300 bg-background/50 backdrop-blur-xl ${shake ? 'ring-2 ring-red-500/50' : isFocused ? 'ring-1 ring-primary/50' : 'ring-1 ring-border/50'}`}>
           {/* Focus Overlay */}
           {!isFocused && !isFinished && (
              <div 
                  className="absolute inset-0 z-40 bg-background/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group hover:bg-background/30"
                  onClick={requestFocus}
              >
                  <div className="bg-background/80 border shadow-2xl px-8 py-5 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in-95 duration-300 group-hover:scale-105 transition-transform">
                      <MousePointerClick className="w-6 h-6 text-primary animate-pulse" />
                      <div className="flex flex-col">
                          <span className="font-bold text-lg">Click to focus</span>
                          <span className="text-xs text-muted-foreground">Keep typing to maintain your streak</span>
                      </div>
                  </div>
              </div>
           )}

           <CardHeader className="bg-muted/5 border-b border-white/5 pb-4 select-none backdrop-blur-sm">
               <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                           <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <KeyboardIcon className="w-4 h-4" />
                           </div>
                           <CardTitle className="font-mono text-sm tracking-tight text-muted-foreground">
                               {currentSnippet?.id}
                           </CardTitle>
                      </div>
                      <CardDescription className="text-lg text-foreground font-medium pl-10 leading-none">{currentSnippet?.description}</CardDescription>
                   </div>
                   <div className="flex gap-2">
                         <div className="text-xs text-muted-foreground flex flex-col items-end justify-center px-4 border-r border-border/50 font-mono">
                             <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] border shadow-sm">ESC</kbd> 
                             <span className="text-[10px] opacity-70 mt-1">to restart</span>
                         </div>
                       <Button variant="ghost" size="icon" onClick={resetGame} className="text-muted-foreground hover:text-foreground hover:bg-muted/20">
                           <RotateCcw className="w-4 h-4" />
                       </Button>
                   </div>
               </div>
           </CardHeader>

           <CardContent className="p-0 flex-1 relative bg-gradient-to-b from-transparent to-muted/5 font-mono text-xl leading-relaxed group">
               {/* The visual Code Overlay */}
               <div 
                  ref={codeContainerRef}
                   className="absolute inset-0 p-8 whitespace-pre-wrap break-words pointer-events-none select-none z-10 overflow-y-auto font-mono scroll-smooth no-scrollbar"
                  style={{ fontFamily: '"Fira Code", monospace', lineHeight: '1.7', tabSize: 2 }}
               >
                   {renderCode()}
               </div>

               {/* The hidden textarea for input */}
               <textarea
                   ref={inputRef}
                   value={userInput}
                   onChange={handleInputChange}
                   onKeyDown={handleKeyDown}
                   onFocus={handleFocus}
                   onBlur={handleBlur}
                   className="absolute inset-0 w-full h-full p-8 bg-transparent text-transparent caret-transparent resize-none border-0 focus:ring-0 focus:outline-none z-20 overflow-y-auto cursor-default font-mono opacity-0 whitespace-pre-wrap break-words"
                   style={{ fontFamily: '"Fira Code", monospace', lineHeight: '1.7', tabSize: 2 }}
                   spellCheck="false"
                   autoComplete="off"
                   autoCapitalize="off"
                   autoCorrect="off"
                   onPaste={(e) => e.preventDefault()}
               />
           </CardContent>
           
           <CardFooter className="border-t border-white/5 bg-muted/5 py-3 px-6 text-xs text-muted-foreground flex justify-between items-center select-none backdrop-blur-sm">
              <div className="flex gap-4">
                  <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 border border-white/10 rounded bg-background/50 shadow-sm text-[10px] font-mono">TAB</kbd> for indent</span>
              </div>
              <div className="flex items-center gap-2 font-mono opacity-60">
                <span>{userInput.length}</span>
                <span className="opacity-40">/</span>
                <span>{currentSnippet?.code.length || 0}</span>
              </div>
           </CardFooter>
        </Card>
      </motion.div>
  );
}
