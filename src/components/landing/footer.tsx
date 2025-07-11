export default function Footer() {
    return (
      <footer className="bg-black/50 py-12 px-8 text-center border-t border-white/10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-center gap-8 mb-8 flex-wrap">
            <a href="#" className="text-[#a1a1aa] no-underline transition-colors duration-300 hover:text-[#00d4aa]">Privacy Policy</a>
            <a href="#" className="text-[#a1a1aa] no-underline transition-colors duration-300 hover:text-[#00d4aa]">Terms of Service</a>
            <a href="#" className="text-[#a1a1aa] no-underline transition-colors duration-300 hover:text-[#00d4aa]">Support</a>
            <a href="#" className="text-[#a1a1aa] no-underline transition-colors duration-300 hover:text-[#00d4aa]">API</a>
            <a href="#" className="text-[#a1a1aa] no-underline transition-colors duration-300 hover:text-[#00d4aa]">Blog</a>
          </div>
          <p className="text-[#6b7280] mt-8">© 2025 LeetCode Explorer. All rights reserved. Built with ❤️ for developers.</p>
        </div>
      </footer>
    );
  }
  