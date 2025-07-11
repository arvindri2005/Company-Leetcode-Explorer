import { StatItemProps } from '@/types';

export function StatItem({ number, label }: StatItemProps) {
  return (
    <div>
      <h3 className="text-4xl text-[#00d4aa] mb-2">{number}</h3>
      <p className="text-[#a1a1aa] text-lg">{label}</p>
    </div>
  );
}
