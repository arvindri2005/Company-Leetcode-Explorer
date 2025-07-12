import React from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Building2 } from 'lucide-react';
import Image from 'next/image';
import { FaSearch } from 'react-icons/fa';

interface Suggestion {
  id: string;
  name: string;
  logo?: string;
  slug: string;
}

interface SearchBarProps {
  searchTermInput: string;
  setSearchTermInput: (value: string) => void;
  isLoadingSuggestions: boolean;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (value: boolean) => void;
  handleSuggestionClick: (suggestion: Suggestion) => void;
  suggestionsRef: React.RefObject<HTMLDivElement>;
}

const CompnaySearchBar: React.FC<SearchBarProps> = ({
  searchTermInput,
  setSearchTermInput,
  isLoadingSuggestions,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  handleSuggestionClick,
  suggestionsRef,
}) => {
  return (
    <div className="relative w-full max-w-[800px] mx-auto">
      <div className="max-w-[800px] mx-auto text-center">
        <div className='relative mt-8'>
          <input
            type="text"
            data-testid="search-input"
            className="w-full p-5 text-lg border border-white/10 rounded-full bg-white/5 text-white backdrop-blur-lg transition-all duration-300 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 placeholder:text-white/50"
            placeholder="Search for Companies... e.g., Amazon, Google"
            value={searchTermInput}
            onChange={(e) => setSearchTermInput(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 || searchTermInput.trim().length > 0) setShowSuggestions(true);
            }}>
          </input>
          
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#00d4aa] to-[#7c3aed] border-none rounded-full w-12 h-12 text-white cursor-pointer transition-all duration-300 hover:scale-110 flex items-center justify-center">
          <FaSearch />
          </button>
        </div>
        
      </div>
      
      {/* <Input
        type="text"
        placeholder="Search companies..."
        value={searchTermInput}
        onChange={(e) => setSearchTermInput(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0 || searchTermInput.trim().length > 0) setShowSuggestions(true);
        }}
        className="w-full pl-9 sm:pl-10 pr-4 text-sm sm:text-base py-3 sm:py-4 lg:py-6 rounded-lg shadow-sm border-2 focus:border-primary transition-colors"
      /> */}

      {isLoadingSuggestions && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-gray-400" />}

      {showSuggestions && searchTermInput.trim().length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-20 mt-2 w-full rounded-2xl bg-white/10 backdrop-blur-[10px] shadow-[0_4px_32px_rgba(0,212,170,0.15)] border border-white/10 overflow-hidden animate-fade-in"
        >
          {isLoadingSuggestions && suggestions.length === 0 ? (
            <p className="p-4 text-base text-[#6b7280]">Loading suggestions...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, idx) => (
              <div
                key={suggestion.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
                className={
                  `flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-200 text-[#e4e4e7] ` +
                  `hover:bg-gradient-to-r hover:from-[#00d4aa]/30 hover:to-[#7c3aed]/30 hover:text-white ` +
                  (idx !== suggestions.length - 1 ? 'border-b border-white/10' : '')
                }
              >
                {suggestion.logo ? (
                  <Image src={suggestion.logo} alt={suggestion.name} width={32} height={32} className="rounded-full bg-white/20" />
                ) : (
                  <Building2 className="h-8 w-8 text-[#6b7280] bg-white/10 rounded-full p-1" />
                )}
                <span className="font-medium text-lg">{suggestion.name}</span>
              </div>
            ))
          ) : (
            !isLoadingSuggestions && (
              <p className="p-4 text-base text-[#6b7280]">No companies found matching "{searchTermInput}".</p>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default CompnaySearchBar;
