import { StatItem } from '@/components/ui/stat-item';
import { STATS } from '@/constants/features';

export default function StatsSection() {
  return (
    <section className="bg-black/30 py-12 px-8 my-12">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {STATS.map((stat, index) => (
          <StatItem key={index} number={stat.number} label={stat.label} />
        ))}
      </div>
    </section>
  );
}
