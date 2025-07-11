export function FloatingShapes() {
    return (
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[1]">
        <div className="absolute bg-gradient-to-r from-[rgba(0,212,170,0.1)] to-[hsla(0,0%,100%,0)] rounded-full w-20 h-20 top-[20%] left-[10%] animate-float"></div>
        <div className="absolute bg-gradient-to-r from-[rgba(0,212,170,0.1)] to-[rgba(124,58,237,0.1)] rounded-full w-32 h-32 top-[60%] right-[10%] animate-float animation-delay-2500"></div>
        <div className="absolute bg-gradient-to-r from-[rgba(0,212,170,0.1)] to-[rgba(124,58,237,0.1)] rounded-full w-16 h-16 top-[80%] left-[20%] animate-float animation-delay-9000"></div>
      </div>
    );
  }
  