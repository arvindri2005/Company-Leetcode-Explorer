/**
 * @fileoverview A component that displays the key features of the application.
 *
 * This component renders a section for the landing page that highlights the
 * main features of Byte to Offer. It dynamically creates a grid of `FeatureCard`
 * components based on a constant array of feature data.
 */
import { FeatureCard } from "@/components/ui/feature-card";
import { FEATURES } from "@/constants/features";

/**
 * Renders the "Features" section of the landing page.
 *
 * This component creates a grid layout to display the application's key features.
 * It iterates over the `FEATURES` constant, passing the data for each feature
 * (icon, title, description) to a `FeatureCard` component for rendering.
 *
 * @returns {JSX.Element} The rendered features section.
 */
export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-4xl mb-12 text-gray-custom-200">
          Why Choose Byte to Offer?
        </h2>
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






