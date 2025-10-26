import { StatItemProps } from "@/types";

/**
 * @function StatItem
 * @description A simple component to display a numerical statistic with a corresponding label.
 * @param {StatItemProps} props - The props for the component, containing the number and label.
 * @returns {JSX.Element} The rendered statistic item.
 */
export function StatItem({ number, label }: StatItemProps) {
  return (
    <div>
      <h3 className="text-4xl text-[#00d4aa] mb-2">{number}</h3>
      <p className="text-[#a1a1aa] text-lg">{label}</p>
    </div>
  );
}
