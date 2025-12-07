import React from "react";
import { Language } from "../_data/snippets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TypingControlsProps {
    selectedLanguage: Language;
    onLanguageChange: (lang: Language) => void;
    disabled: boolean;
}

export default function TypingControls({
    selectedLanguage,
    onLanguageChange,
    disabled
}: TypingControlsProps) {
  return (
    <Select 
        value={selectedLanguage} 
        onValueChange={(val) => onLanguageChange(val as Language)}
        disabled={disabled}
    >
        <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-md border-white/10 hover:bg-background/80 transition-colors shadow-sm">
            <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
            <SelectItem value="go">Go</SelectItem>
            <SelectItem value="rust">Rust</SelectItem>
            <SelectItem value="sql">SQL</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="css">CSS</SelectItem>
        </SelectContent>
    </Select>
  );
}
