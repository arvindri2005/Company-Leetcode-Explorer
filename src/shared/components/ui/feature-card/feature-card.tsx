import { type FeatureCardProps } from "@/shared/types";

/**
 * @function FeatureCard
 * @description A card component designed to showcase a specific feature, with an icon, title, and description.
 * @param {FeatureCardProps} props - The props for the component, containing icon, title, and description.
 * @returns {JSX.Element} The rendered feature card.
 */
export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const Icon = icon;
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center transition-all duration-300 backdrop-blur-[10px] hover:transform hover:-translate-y-2 hover:border-brand-teal hover:shadow-glow-lg">
      <div className="text-5xl text-brand-teal mb-4">{Icon && <Icon />}</div>
      <h3 className="text-2xl mb-4 text-gray-custom-200">{title}</h3>
      <p className="text-gray-custom-400 leading-relaxed">{description}</p>
    </div>
  );
}






