import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { snippets } from "@/constants/typing-test-snippets";
import { Snippet, Language } from "@/types/typing-test";

// Utility to calculate WPM
// Raw WPM = (Total Characters / 5) / Time (min)
// Net WPM = Raw WPM - (Uncorrected Errors / Time (min)) - Simplified here to just standard WPM formula but tracking mistakes separately
const calculateWPM = (startTime: number | null, endTime: number | null, charCount: number) => {
  if (!startTime) return 0;
  const end = endTime || Date.now();
  const timeInMinutes = (end - startTime) / 60000;
  if (timeInMinutes <= 0) return 0;
  return Math.round((charCount / 5) / timeInMinutes);
};

export const useTypingGame = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("javascript");
  const [currentSnippet, setCurrentSnippet] = useState<Snippet | null>(null);
  
  // Game State
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFocused, setIsFocused] = useState(false);
  const [totalMistakes, setTotalMistakes] = useState(0);

  // Stats History
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number }[]>([]);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const resetGame = useCallback(() => {
    setUserInput("");
    setStartTime(null);
    setEndTime(null);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setTotalMistakes(0);
    setWpmHistory([]);
    if(inputRef.current) {
        inputRef.current.focus();
        // Reset selection to 0
        inputRef.current.selectionStart = 0;
        inputRef.current.selectionEnd = 0;
    }
  }, []);

  // Initialize snippet
  useEffect(() => {
    // Only select new snippet if we don't have one or language changed
    // We want to avoid resetting if just the hook re-runs, but here it depends on selectedLanguage
    const filtered = snippets.filter(s => s.language === selectedLanguage);
    if (filtered.length > 0) {
        // Only if current snippet doesn't match language (or is null)
        if (!currentSnippet || currentSnippet.language !== selectedLanguage) {
             const randomSnippet = filtered[Math.floor(Math.random() * filtered.length)];
             setCurrentSnippet(randomSnippet);
             resetGame();
        }
    } else {
        setCurrentSnippet(null);
    }
    // Adding currentSnippet would cause infinite loop if we change it here,
    // but we only change it if language mismatches.
    // However, setCurrentSnippet triggers re-render, and if currentSnippet changes reference, effect runs again?
    // We rely on currentSnippet.language check to be stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, resetGame]);

  // Focus input on load
  useEffect(() => {
    if (!isFinished && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isFinished]);

  // WPM History Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !isFinished) {
      interval = setInterval(() => {
        const timeElapsed = Math.round((Date.now() - startTime) / 1000);
        const currentWpm = calculateWPM(startTime, Date.now(), userInput.length);
        setWpmHistory(prev => [...prev, { time: timeElapsed, wpm: currentWpm }]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isFinished, userInput.length]);

  // Auto-scroll to cursor
  useEffect(() => {
    if (cursorRef.current && codeContainerRef.current) {
        const container = codeContainerRef.current;
        const cursorHandler = cursorRef.current;
        
        const cursorTop = cursorHandler.offsetTop;
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;

        // Keep cursor in middle-ish
        if (cursorTop > scrollTop + containerHeight - 100) {
            container.scrollTo({ top: cursorTop - containerHeight / 2, behavior: 'smooth' });
        } else if (cursorTop < scrollTop + 50) {
             container.scrollTo({ top: cursorTop - 100, behavior: 'smooth' });
        }
    }
  }, [userInput]);

  const nextSnippet = useCallback(() => {
    const filtered = snippets.filter(s => s.language === selectedLanguage);
    if (filtered.length === 0) return;

    let next = filtered[Math.floor(Math.random() * filtered.length)];
    // Try to get a different one
    if (filtered.length > 1 && currentSnippet) {
        let attempts = 0;
        while (next.id === currentSnippet.id && attempts < 10) {
            next = filtered[Math.floor(Math.random() * filtered.length)];
            attempts++;
        }
    }
    setCurrentSnippet(next);
    resetGame();
  }, [selectedLanguage, currentSnippet, resetGame]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Quick Restart
    if (e.key === 'Escape') {
        e.preventDefault();
        resetGame();
        return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (isFinished) return;
      
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      
      setUserInput(newValue);
      
      // Update cursor position
      setTimeout(() => {
          if (inputRef.current) {
              inputRef.current.selectionStart = inputRef.current.selectionEnd = start + 2;
          }
      }, 0);
      
      if (!startTime) setStartTime(Date.now());
    }
    
    // Smart Indentation on Enter
    if (e.key === 'Enter') {
        if (isFinished) return;
        e.preventDefault();
        
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const value = e.currentTarget.value;
        
        // Find the start of the current line
        const lastNewLine = value.lastIndexOf('\n', start - 1);
        const currentLineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
        const currentLine = value.substring(currentLineStart, start);
        
        // Calculate indentation
        const match = currentLine.match(/^(\s*)/);
        let indentation = match ? match[1] : "";
        
        // Check for opener char at end of current line segment (ignoring whitespace)
        const trimmedLine = currentLine.trimEnd();
        if (trimmedLine.endsWith('{') || trimmedLine.endsWith('(') || trimmedLine.endsWith('[')) {
            indentation += "  "; // Add 2 spaces indent
        }
        
        const insertion = "\n" + indentation;
        const newValue = value.substring(0, start) + insertion + value.substring(end);
        
        setUserInput(newValue);
        
        setTimeout(() => {
          if (inputRef.current) {
              inputRef.current.selectionStart = inputRef.current.selectionEnd = start + insertion.length;
          }
      }, 0);
      
      if (!startTime) setStartTime(Date.now());
    }
  }, [isFinished, startTime, resetGame]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished || !currentSnippet) return;

    const value = e.target.value;
    const prevValue = userInput;
    
    // Start timer on first char
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Mistake tracking logic:
    // If the new char added at the end is incorrect, increment mistakes
    if (value.length > prevValue.length) {
        const newCharIndex = value.length - 1;
        if (newCharIndex < currentSnippet.code.length) {
            if (value[newCharIndex] !== currentSnippet.code[newCharIndex]) {
                setTotalMistakes(prev => prev + 1);
            }
        } else {
             // Overtyping beyond length is a mistake
             setTotalMistakes(prev => prev + 1);
        }
    }

    setUserInput(value);

    // Check completion
    if (value.length >= currentSnippet.code.length) {
        if (value === currentSnippet.code) {
             const end = Date.now();
             setEndTime(end);
             setIsFinished(true);
             const finalWpm = calculateWPM(startTime || Date.now(), end, value.length);
             setWpm(finalWpm);
             setWpmHistory(prev => [...prev, { time: Math.round((end - (startTime || end))/1000), wpm: finalWpm }]);
        }
    }
    
    // Calculate Live Stats
    if (startTime) {
        const currentWpm = calculateWPM(startTime, Date.now(), value.length);
        setWpm(currentWpm);
        
        let correctChars = 0;
        for (let i = 0; i < value.length; i++) {
            if (value[i] === currentSnippet.code[i]) {
                correctChars++;
            }
        }
        const acc = value.length > 0 ? Math.round((correctChars / value.length) * 100) : 100;
        setAccuracy(acc);
    }
  }, [isFinished, currentSnippet, startTime, userInput]);

  const progress = useMemo(() => {
    if (!currentSnippet) return 0;
    return Math.min(100, (userInput.length / currentSnippet.code.length) * 100);
  }, [userInput, currentSnippet]);

  return {
      selectedLanguage, setSelectedLanguage,
      currentSnippet,
      userInput, setUserInput,
      wpm, accuracy, wpmHistory,
      isFinished, isFocused,
      setIsFocused,
      inputRef, codeContainerRef, cursorRef,
      resetGame, nextSnippet,
      handleKeyDown, handleInputChange,
      progress,
      mistakes: totalMistakes, // Return cumulative mistakes
      currentMistakes: useMemo(() => { // Also return current mistakes on screen if needed
          if (!currentSnippet) return 0;
          let count = 0;
          for (let i = 0; i < userInput.length; i++) {
            if (userInput[i] !== currentSnippet.code[i]) count++;
          }
          return count;
      }, [userInput, currentSnippet])
  };
};
