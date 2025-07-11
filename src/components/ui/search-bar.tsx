'use client';

import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (searchTerm: string) => void;
  className?: string;
}

export default function searchBar({ 
  placeholder = "Search...", 
  onSearch,
  className = ""
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch?.(searchTerm);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-[800px] mx-auto text-center">
        <h2 className="text-4xl mb-4 text-[#e4e4e7]">Start Your Journey</h2>
        <p className="text-xl mb-8 text-[#a1a1aa]">Search for problems by name, topic, or difficulty level</p>
        <div className="relative mt-8">
          <input
            type="text"
            className="w-full p-6 text-lg border-2 border-white/10 rounded-full bg-white/5 text-[#e4e4e7] backdrop-blur-[10px] transition-all duration-300 focus:outline-none focus:border-[#00d4aa] focus:shadow-[0_0_20px_rgba(0,212,170,0.2)] placeholder:text-[#6b7280]"
            placeholder="Search for Compnaies... e.g., Amazon, Google"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#00d4aa] to-[#7c3aed] border-none rounded-full w-12 h-12 text-white cursor-pointer transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <FaSearch />
          </button>
        </div>
      </div>
  );
}
