"use client";

import React from "react";
import { useTypingGame } from "@/hooks/use-typing-game";
import TypingArea from "./typing-area";
import TypingStats from "./typing-stats";
import TypingResults from "./typing-results";
import TypingControls from "./typing-controls";

export default function TypingTestGame() {
  const {
      selectedLanguage, setSelectedLanguage,
      currentSnippet,
      userInput,
      wpm, accuracy, wpmHistory,
      isFinished, isFocused,
      setIsFocused,
      inputRef, codeContainerRef, cursorRef,
      resetGame, nextSnippet,
      handleKeyDown, handleInputChange,
      progress,
      mistakes
  } = useTypingGame();

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const requestFocus = () => inputRef.current?.focus();

  return (
    <div className="relative min-h-[600px] -mx-4 sm:-mx-8 p-4 sm:p-8 rounded-xl overflow-hidden bg-gradient-to-br from-background via-muted/20 to-primary/5">
      {/* Ambient background glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
      
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pb-2">
          <TypingControls 
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              disabled={(!isFinished && userInput.length > 0)}
          />

          <TypingStats wpm={wpm} accuracy={accuracy} mistakes={mistakes} />
        </div>

        <div className="relative group perspective-1000">
            {/* Glossy Progress Bar Container */}
           <div className="h-1.5 w-full bg-muted/30 rounded-t-lg overflow-hidden absolute top-0 left-0 right-0 z-20 backdrop-blur-sm border-b border-white/5">
              <div 
                  className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300 ease-out shadow-glow-primary" 
                  style={{ width: `${progress}%` }}
              />
           </div>

           {/* Results Overlay */}
           {isFinished && (
               <TypingResults 
                  wpm={wpm}
                  accuracy={accuracy}
                  mistakes={mistakes}
                  wpmHistory={wpmHistory}
                  onNextSnippet={nextSnippet}
                  onRetry={resetGame}
               />
           )}

           <TypingArea 
              currentSnippet={currentSnippet}
              userInput={userInput}
              isFocused={isFocused}
              isFinished={isFinished}
              mistakes={mistakes}
              inputRef={inputRef}
              codeContainerRef={codeContainerRef}
              cursorRef={cursorRef}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              resetGame={resetGame}
              requestFocus={requestFocus}
           />
        </div>
      </div>
    </div>
  );
}
