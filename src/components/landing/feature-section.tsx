import { FeatureCard } from '@/components/ui/feature-card';
import { FEATURES } from '@/constants/features';

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-8">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-center text-4xl mb-12 text-[#e4e4e7]">Why Choose Byte to Offer?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <FeatureCard
                key={index}
                icon={Icon}
                title={feature.title}
                description={feature.description}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
