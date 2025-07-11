'use client';

import { FaRocket, FaPlay } from 'react-icons/fa';
import { FloatingShapes } from '@/components/ui/floatingShapes';
import { useRouter } from 'next/navigation';

export default function HeroSection() {

  const router = useRouter();

  const handleClick = () => {
    router.push('/companies');
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center text-center relative px-8">
      <FloatingShapes />
      <div className="max-w-[800px] z-[2]">
        <h1 className="text-6xl mb-4 bg-gradient-to-r from-[#00d4aa] to-[#7c3aed] bg-clip-text text-transparent animate-fadeInUp">
          Master Your Coding Interviews
        </h1>
        <p className="text-2xl mb-8 text-[#a1a1aa] animate-fadeInUp animation-delay-200">
          Explore thousands of real world interview problems with detailed solutions, explanations, and interview tips. Your journey to landing your dream job starts here.
        </p>
        <div className="flex gap-4 justify-center flex-wrap animate-fadeInUp animation-delay-400">
          <button className="px-8 py-4 border-none rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 no-underline inline-flex items-center gap-2 bg-gradient-to-r from-[#00d4aa] to-[#7c3aed] text-white hover:transform hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,212,170,0.3)]"
            onClick={handleClick}>
            <FaRocket />
            Start Exploring
          </button>
          <button className="px-8 py-4 bg-transparent text-[#e4e4e7] border-2 border-[#374151] rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 no-underline inline-flex items-center gap-2 hover:border-[#00d4aa] hover:text-[#00d4aa]">
            <FaPlay />
            Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
}
