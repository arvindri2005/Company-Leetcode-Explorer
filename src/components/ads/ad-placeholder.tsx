/**
 * @fileoverview A placeholder component for Google Ad placements.
 *
 * This component is used to visually represent where Google Ads will be
 * displayed in the application layout. It helps in designing and aligning
 * the ad spaces before the actual ad script is integrated.
 */
import { DollarSign } from "lucide-react";

/**
 * Props for the AdPlaceholder component.
 */
interface AdPlaceholderProps {
  /** The title for the ad placeholder, e.g., "Advertisement". */
  title?: string;
  /** Additional CSS classes to apply to the component. */
  className?: string;
}

/**
 * Renders a visual placeholder for an advertisement.
 *
 * This component displays a styled box with a title and an icon, clearly
 * marking the area where an ad will be shown. It's useful for development
 * and layout planning.
 *
 * @param {AdPlaceholderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered ad placeholder component.
 */
export default function AdPlaceholder({
  title = "Advertisement",
  className = "",
}: AdPlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-64 w-full bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg text-muted-foreground p-4 text-center ${className}`}
    >
      <DollarSign className="h-10 w-10 mb-2" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs">Ad space</p>
    </div>
  );
}
