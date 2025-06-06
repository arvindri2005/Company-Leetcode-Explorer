
'use client';

import type { LeetCodeProblem, ChatMessage } from '@/types';
import type { MockInterviewOutput } from '@/ai/flows/mock-interview-flow';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { handleInterviewTurn } from '@/app/actions';
import { Send, User, Bot, Loader2, CornerDownLeft, Mic, MicOff, Volume2, VolumeX, MessageSquareQuote, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAICooldown } from '@/hooks/use-ai-cooldown';

interface MockInterviewChatProps {
  problem: LeetCodeProblem;
  companySlug: string; 
}

interface UIMessage extends ChatMessage {
    id: string;
    suggestedFollowUps?: string[];
}

const SpeechRecognition = (typeof window !== 'undefined') ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const speechSynthesis = (typeof window !== 'undefined') ? window.speechSynthesis : null;

const MockInterviewChat: React.FC<MockInterviewChatProps> = ({ problem, companySlug }) => {
  const [conversation, setConversation] = useState<UIMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [isSessionLoading, setIsSessionLoading] = useState(true); 
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { canUseAI, startCooldown, formattedRemainingTime, isLoadingCooldown } = useAICooldown();

  const [sessionAiMessageCount, setSessionAiMessageCount] = useState(0); // Counter for AI messages in this session

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isBrowserUnsupported, setIsBrowserUnsupported] = useState(false);

  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  useEffect(() => {
    if (!SpeechRecognition || !speechSynthesis) {
      setIsBrowserUnsupported(true);
    }
  }, []);

  useEffect(() => {
    if (isBrowserUnsupported) {
      toast({
        title: "Audio Features Unavailable",
        description: "Your browser does not fully support the Web Speech API needed for audio input/output.",
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [isBrowserUnsupported, toast]);

  const startInterviewSession = useCallback(async () => {
    if (isLoadingCooldown) {
      setIsSessionLoading(true);
      return;
    }

    if (!canUseAI) {
      setConversation([{
        id: 'cooldown-message',
        role: 'model',
        content: `AI features are currently on cooldown. Please wait ${formattedRemainingTime}. The interview cannot start yet.`
      }]);
      setIsSessionLoading(false);
      return;
    }
    
    setIsSessionLoading(true);
    setIsLoading(true); 
    setConversation([]);
    setSessionAiMessageCount(0); // Reset session message count
    
    const result = await handleInterviewTurn(problem.companySlug, problem.slug, [], "Let's begin the interview.");
    
    let initialMessages: UIMessage[] = [];
    if (result.interviewerResponse) {
      let aiContent = result.interviewerResponse;
      if (result.feedback) {
        aiContent += formatFeedback(result.feedback);
      }
      const newAIMessage: UIMessage = { id: Date.now().toString(), role: 'model', content: aiContent, suggestedFollowUps: result.suggestedFollowUps };
      initialMessages.push(newAIMessage);
      if (isTTSEnabled && !isBrowserUnsupported) speakText(aiContent);

      const newCount = 1; // First AI message
      setSessionAiMessageCount(newCount);
      if (newCount >= 5) {
        startCooldown(); 
      }

    } else if (result.error) {
      toast({ title: 'Error starting interview', description: result.error, variant: 'destructive' });
      initialMessages.push({ id: Date.now().toString(), role: 'model', content: `I couldn't initialize the session for ${problem.title} due to an error. Please try refreshing or select another problem.` });
    }
    setConversation(initialMessages);
    setIsLoading(false);
    setIsSessionLoading(false);
  }, [problem.slug, problem.companySlug, problem.title, toast, isTTSEnabled, isBrowserUnsupported, canUseAI, isLoadingCooldown, formattedRemainingTime, startCooldown]);

  useEffect(() => {
    startInterviewSession();
  }, [startInterviewSession]);


  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.firstChild as HTMLElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(scrollToBottom, [conversation]);

  const speakText = (text: string) => {
    if (!speechSynthesis || !isTTSEnabled) return;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); 
    }
    
    const plainText = text.replace(/```[\s\S]*?```/g, 'Code block.') 
                         .replace(/`[^`]+`/g, 'Inline code.')    
                         .replace(/(\*\*|__)(.*?)\1/g, '$2')    
                         .replace(/(\*|_)(.*?)\1/g, '$2')      
                         .replace(/#+\s/g, '')                 
                         .replace(/\[.*?\]\(.*?\)/g, 'Link.'); 
    utteranceRef.current = new SpeechSynthesisUtterance(plainText);
    speechSynthesis.speak(utteranceRef.current);
  };

  const formatFeedback = (feedback: NonNullable<MockInterviewOutput['feedback']>): string => {
    let markdown = "\n\n---\n\n**Feedback on Your Approach:**\n";
    if (feedback.solutionAssessment) markdown += `\n*   **Assessment:** ${feedback.solutionAssessment}\n`;
    if (feedback.correctnessDetails) markdown += `*   **Correctness Details:** ${feedback.correctnessDetails}\n`;
    if (feedback.timeComplexity) markdown += `*   **Time Complexity:** ${feedback.timeComplexity}\n`;
    if (feedback.spaceComplexity) markdown += `*   **Space Complexity:** ${feedback.spaceComplexity}\n`;
    if (feedback.alternativeApproaches && feedback.alternativeApproaches.length > 0) {
      markdown += `*   **Alternative Approaches:**\n`;
      feedback.alternativeApproaches.forEach(alt => {
        markdown += `    *   ${alt}\n`;
      });
    }
    if (feedback.codeQualitySuggestions) markdown += `*   **Code Quality:** ${feedback.codeQualitySuggestions}\n`;
    return markdown;
  };

  const submitUserTurn = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || !canUseAI) return; // Check global canUseAI

    const newUserMessage: UIMessage = { id: Date.now().toString(), role: 'user', content: messageContent.trim() };
    setConversation(prev => [...prev, newUserMessage]);
    
    const historyForAI: ChatMessage[] = conversation.map(({id, role, content}) => ({role, content}));
    historyForAI.push({role: 'user', content: newUserMessage.content});


    setUserInput(''); 
    setIsLoading(true);
    
    const result = await handleInterviewTurn(problem.companySlug, problem.slug, historyForAI.slice(0, -1), newUserMessage.content);
    setIsLoading(false);

    if (result.interviewerResponse) {
      let aiResponseContent = result.interviewerResponse;
      if (result.feedback) {
        const formatted = formatFeedback(result.feedback);
        if (formatted.trim().length > 50) { 
          aiResponseContent += formatted;
        }
      }
      const newAIMessage: UIMessage = { id: (Date.now() + 1).toString(), role: 'model', content: aiResponseContent, suggestedFollowUps: result.suggestedFollowUps };
      setConversation(prev => [...prev, newAIMessage]);
      if (isTTSEnabled && !isBrowserUnsupported) speakText(aiResponseContent);

      setSessionAiMessageCount(prevCount => {
          const newCount = prevCount + 1;
          if (newCount >= 5) { 
              startCooldown(); 
          }
          return newCount;
      });

    } else {
      toast({
        title: 'Error during interview',
        description: result.error || 'Failed to get a response from the interviewer.',
        variant: 'destructive',
      });
    }
  };

  const handleManualSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    submitUserTurn(userInput);
  };
  
  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitUserTurn(userInput);
    }
  };

  const handleToggleRecording = async () => {
    if (isBrowserUnsupported || !SpeechRecognition || !canUseAI) return; // Check global canUseAI

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        if (micPermission !== 'granted') {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); 
            setMicPermission('granted');
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; 
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          setUserInput(''); 
          toast({ title: "Recording started...", description: "Speak now." });
        };

        let finalTranscript = '';
        recognitionRef.current.onresult = (event) => {
          let interimTranscript = '';
          finalTranscript = userInput.substring(0, userInput.length - interimTranscript.length); 
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setUserInput(finalTranscript + interimTranscript); 
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          let errorMsg = "Speech recognition error.";
          if (event.error === 'no-speech') errorMsg = "No speech was detected. Please try again.";
          if (event.error === 'audio-capture') errorMsg = "Microphone not found or not working.";
          if (event.error === 'not-allowed') {
            errorMsg = "Microphone access was not allowed. Please enable it in your browser settings.";
            setMicPermission('denied');
          }
          toast({ title: "Recording Error", description: errorMsg, variant: "destructive" });
        };
        
        recognitionRef.current.start();

      } catch (error) {
        console.error('Error starting recording:', error);
        setMicPermission('denied');
        toast({ title: "Could not start recording", description: "Please ensure microphone permissions are granted and your browser supports Web Speech API.", variant: "destructive" });
        setIsRecording(false);
      }
    }
  };
  
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort(); 
      if (speechSynthesis?.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleTTS = () => {
    setIsTTSEnabled(prev => {
      const newState = !prev;
      if (!newState && speechSynthesis?.speaking) {
        speechSynthesis.cancel();
      }
      toast({ title: `AI Speech ${newState ? 'Enabled' : 'Disabled'}` });
      return newState;
    });
  };

  if (isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Preparing interview session...</p>
         {isLoadingCooldown && <p className="text-xs text-muted-foreground mt-1">(Checking AI feature availability...)</p>}
      </div>
    );
  }
  
  const isInputDisabled = isLoading || isRecording || !canUseAI; // Use global canUseAI

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg shadow-sm">
      {isBrowserUnsupported && (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>Browser Not Fully Supported</AlertTitle>
          <AlertDescription>
            Audio input/output features may not work correctly as your browser doesn't fully support the Web Speech API.
            You can still use text input.
          </AlertDescription>
        </Alert>
      )}
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {conversation.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex flex-col gap-1 p-3 rounded-lg max-w-[85%] text-sm leading-relaxed shadow-sm mb-3', 
              msg.role === 'user' ? 'ml-auto bg-primary text-primary-foreground items-end' : 'mr-auto bg-muted text-foreground border items-start'
            )}
          >
            <div className={cn('flex items-start gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                {msg.role === 'model' && <Bot className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />}
                <div className="message-content prose prose-sm dark:prose-invert max-w-full break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        pre({node, ...props}) { return <pre className="bg-background/50 p-2 my-2 rounded overflow-x-auto text-xs leading-normal" {...props} />; },
                        code({node, inline, className, children, ...props}) {
                            return !inline ? (
                            <code className={cn(className, 'font-mono text-xs')} {...props}>{children}</code>
                            ) : (
                            <code className={cn(className, "bg-muted-foreground/20 px-1 py-0.5 rounded text-xs font-mono")} {...props}>{children}</code>
                            );
                        },
                        p: React.Fragment, 
                        ul({node, ...props}) { return <ul className="list-disc list-inside my-1 space-y-0.5 pl-4" {...props} />; },
                        ol({node, ...props}) { return <ol className="list-decimal list-inside my-1 space-y-0.5 pl-4" {...props} />; },
                        li({node, ...props}) { return <li className="my-0" {...props} />; },
                        h1: ({node, ...props}) => <h1 className="text-lg font-semibold my-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-md font-semibold my-1.5" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-semibold my-1" {...props} />,
                        hr: ({node, ...props}) => <Separator className="my-3" {...props} />,
                    }}>
                        {msg.content}
                    </ReactMarkdown>
                </div>
                {msg.role === 'user' && <User className="h-5 w-5 flex-shrink-0 mt-0.5" />}
            </div>
            {msg.role === 'model' && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50 w-full">
                <h4 className="text-xs font-semibold mb-1.5 flex items-center text-muted-foreground">
                  <MessageSquareQuote size={14} className="mr-1.5" /> Points to Consider:
                </h4>
                <ul className="list-disc list-inside space-y-1 pl-4 text-xs">
                  {msg.suggestedFollowUps.map((followUp, fIndex) => (
                    <li key={`followup-${msg.id}-${fIndex}`}>{followUp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {isLoading && conversation.length > 0 && !isSessionLoading && ( 
          <div className="flex items-start gap-3 p-3 rounded-lg max-w-[85%] mr-auto bg-muted border">
            <Bot className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
         {conversation.length === 0 && !isLoading && !isSessionLoading && ( 
            <div className="text-center text-muted-foreground p-6">
                <p>Starting interview session for {problem.title}...</p>
            </div>
        )}
      </ScrollArea>
      <form onSubmit={handleManualSubmit} className="p-3 border-t bg-background rounded-b-lg">
        {!canUseAI && !isLoadingCooldown && ( // Check if global cooldown is active
             <div className="mb-2 text-xs text-destructive flex items-center justify-center p-2 bg-destructive/10 rounded-md">
                <AlertCircle size={14} className="mr-1.5" />
                AI features are on cooldown. Please wait {formattedRemainingTime}.
             </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={isRecording ? "Recording... Speak now." : "Type your thoughts or code..."}
            className="resize-none min-h-[48px] max-h-[180px] flex-grow rounded-md shadow-sm focus:ring-2 focus:ring-primary"
            rows={1}
            disabled={isInputDisabled}
          />
          {!isBrowserUnsupported && (
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              className="flex-shrink-0 h-10 w-10 rounded-md"
              onClick={handleToggleRecording}
              disabled={isLoading || !canUseAI} // Also disable if global cooldown active
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            className="flex-shrink-0 h-10 w-10 rounded-md" 
            disabled={isInputDisabled || !userInput.trim()}
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
         <div className="mt-1.5 text-xs text-muted-foreground flex items-center justify-between">
            <span><CornerDownLeft size={12} className="mr-1 inline-block" />Shift+Enter for new line</span>
            {!isBrowserUnsupported && (
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleTTS} 
                    className="p-1 h-auto text-muted-foreground hover:text-foreground"
                    aria-label={isTTSEnabled ? "Disable AI speech" : "Enable AI speech"}
                    disabled={!canUseAI && !isLoadingCooldown} // Disable if global cooldown active
                >
                    {isTTSEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span className="sr-only">{isTTSEnabled ? "Mute AI" : "Unmute AI"}</span>
                </Button>
            )}
          </div>
      </form>
    </div>
  );
};

export default MockInterviewChat;

    