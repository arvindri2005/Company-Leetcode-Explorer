import { FeatureCardProps } from '@/types';

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const Icon = icon;
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center transition-all duration-300 backdrop-blur-[10px] hover:transform hover:-translate-y-2 hover:border-[#00d4aa] hover:shadow-[0_20px_40px_rgba(0,212,170,0.1)]">
      <div className="text-5xl text-[#00d4aa] mb-4">{Icon && <Icon />}</div>
      <h3 className="text-2xl mb-4 text-[#e4e4e7]">{title}</h3>
      <p className="text-[#a1a1aa] leading-relaxed">{description}</p>
    </div>
  );
}
