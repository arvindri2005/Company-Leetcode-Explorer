import { useCallback,useEffect, useMemo, useRef, useState } from "react";

import { snippets } from "@/constants/typing-test-snippets";
import { type Language,type Snippet } from "@/features/tools";
import {
  calculateAccuracy,
  calculateWPM,
  checkMistake,
  countCurrentMistakes,
  processEnterKey,
  processTabKey} from "@/features/tools/utils/typing-game-logic";

export const useTypingGame = () => {
  // Game State
  const [selectedLanguage, setSelectedLanguageState] = useState<Language>("javascript");
  
  // Lazy initialization of random snippet to avoid effect-based initialization
  const [currentSnippet, setCurrentSnippet] = useState<Snippet | null>(() => {
      const filtered = snippets.filter(s => s.language === "javascript");
      if (filtered.length > 0) {
          return filtered[Math.floor(Math.random() * filtered.length)];
      }
      return null;
  });

  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [, setEndTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFocused, setIsFocused] = useState(false);
  const [totalMistakes, setTotalMistakes] = useState(0);

  // Stats History
  const [wpmHistory, setWpmHistoryState] = useState<{ time: number; wpm: number }[]>([]);
  // Use a ref for live history tracking to avoid re-renders every second
  const wpmHistoryRef = useRef<{ time: number; wpm: number }[]>([]);

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
    setWpmHistoryState([]);
    wpmHistoryRef.current = [];
    if(inputRef.current) {
        inputRef.current.focus();
        // Reset selection to 0
        inputRef.current.selectionStart = 0;
        inputRef.current.selectionEnd = 0;
    }
  }, []);

  // Set Language and update snippet logic
  const setSelectedLanguage = useCallback((lang: Language) => {
      setSelectedLanguageState(lang);
      
      const filtered = snippets.filter(s => s.language === lang);
      if (filtered.length > 0) {
           // Only change if different language or forcing new one? 
           // The original logic checked (!currentSnippet || currentSnippet.language !== selectedLanguage)
           // Since we are setting the language now, we assume we want a snippet for THAT language.
           const randomSnippet = filtered[Math.floor(Math.random() * filtered.length)];
           setCurrentSnippet(randomSnippet);
           resetGame();
      } else {
          setCurrentSnippet(null);
      }
  }, [resetGame]);

  // Focus input on load
  useEffect(() => {
    if (!isFinished && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isFinished]);

  // Ref to track user input length without triggering re-renders in the interval
  const userInputLengthRef = useRef(userInput.length);
  useEffect(() => {
    userInputLengthRef.current = userInput.length;
  }, [userInput.length]);

  // WPM History Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !isFinished) {
      interval = setInterval(() => {
        const timeElapsed = Math.round((Date.now() - startTime) / 1000);
        const currentWpm = calculateWPM(startTime, Date.now(), userInputLengthRef.current);
        // Push to ref instead of state to avoid re-render
        wpmHistoryRef.current.push({ time: timeElapsed, wpm: currentWpm });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  // Auto-scroll to cursor
  useEffect(() => {
    if (cursorRef.current && codeContainerRef.current) {
        const container = codeContainerRef.current;
        const cursorHandler = cursorRef.current;
        
        const cursorTop = cursorHandler.offsetTop;
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;

        if (cursorTop > scrollTop + containerHeight - 100) {
            container.scrollTo({ top: cursorTop - containerHeight / 2, behavior: 'smooth' });
        } else if (cursorTop < scrollTop + 50) {
             container.scrollTo({ top: cursorTop - 100, behavior: 'smooth' });
        }
    }
  }, [userInput]);

  const nextSnippet = useCallback(() => {
    const filtered = snippets.filter(s => s.language === selectedLanguage);
    if (filtered.length === 0) {return;}

    let next = filtered[Math.floor(Math.random() * filtered.length)];
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
    if (e.key === 'Escape') {
        e.preventDefault();
        resetGame();
        return;
    }
    
    if (isFinished) {return;}

    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;
    const value = e.currentTarget.value;

    if (e.key === 'Tab') {
      e.preventDefault();
      const { newValue, newCursorPos } = processTabKey(value, start, end);
      
      setUserInput(newValue);
      
      setTimeout(() => {
          if (inputRef.current) {
              inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPos;
          }
      }, 0);
      
      if (!startTime) {setStartTime(Date.now());}
    }
    
    if (e.key === 'Enter') {
        e.preventDefault();
        const { newValue, newCursorPos } = processEnterKey(value, start, end);
        
        setUserInput(newValue);
        
        setTimeout(() => {
          if (inputRef.current) {
              inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPos;
          }
      }, 0);
      
      if (!startTime) {setStartTime(Date.now());}
    }
  }, [isFinished, startTime, resetGame]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished || !currentSnippet) {return;}

    const value = e.target.value;
    const prevValue = userInput;
    
    // Start timer on first char
    if (!startTime) {
      setStartTime(Date.now());
    }

    if (checkMistake(value, prevValue, currentSnippet.code)) {
        setTotalMistakes(prev => prev + 1);
    }

    setUserInput(value);

    // Check completion
    if (value === currentSnippet.code) {
         const end = Date.now();
         setEndTime(end);
         setIsFinished(true);
         const finalWpm = calculateWPM(startTime || Date.now(), end, value.length);
         setWpm(finalWpm);
         
         const finalTime = Math.round((end - (startTime || end))/1000);
         wpmHistoryRef.current.push({ time: finalTime, wpm: finalWpm });
         // Update state once at the end
         setWpmHistoryState([...wpmHistoryRef.current]);
    }
    
    // Calculate Live Stats
    if (startTime) {
        setWpm(calculateWPM(startTime, Date.now(), value.length));
        setAccuracy(calculateAccuracy(value, currentSnippet.code));
    }
  }, [isFinished, currentSnippet, startTime, userInput]);

  const progress = useMemo(() => {
    if (!currentSnippet) {return 0;}
    return Math.min(100, (userInput.length / currentSnippet.code.length) * 100);
  }, [userInput, currentSnippet]);

  return {
      selectedLanguage, 
      setSelectedLanguage, // Expose the wrapper instead of state setter
      currentSnippet,
      userInput, setUserInput,
      wpm, accuracy, 
      wpmHistory, // This is the state version, updated only at end
      isFinished, isFocused,
      setIsFocused,
      inputRef, codeContainerRef, cursorRef,
      resetGame, nextSnippet,
      handleKeyDown, handleInputChange,
      progress,
      mistakes: totalMistakes, 
      currentMistakes: useMemo(() => { 
          if (!currentSnippet) {return 0;}
          return countCurrentMistakes(userInput, currentSnippet.code);
      }, [userInput, currentSnippet])
  };
};






