/**
 * @fileoverview A component that displays key statistics for the landing page.
 *
 * This component renders a section that showcases important metrics or stats
 * about the application, such as the number of companies, problems, etc. It
 * dynamically generates these stats from a constant data array.
 */
import { StatItem } from "@/components/ui/stat-item";
import { STATS } from "@/constants/features";

/**
 * Renders the "Stats" section of the landing page.
 *
 * This component creates a grid layout to display a series of key statistics.
 * It iterates over the `STATS` constant, passing the data for each statistic
 * (a number and a label) to a `StatItem` component for rendering.
 *
 * @returns {JSX.Element} The rendered stats section.
 */
export default function StatsSection() {
  return (
    <section className="bg-black/30 py-12 px-8 my-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {STATS.map((stat, index) => (
          <StatItem key={index} number={stat.number} label={stat.label} />
        ))}
      </div>
    </section>
  );
}
