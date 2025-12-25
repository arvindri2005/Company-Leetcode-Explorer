import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * @interface ActionFeatureCardProps
 * @description Defines the props for the ActionFeatureCard component.
 * @property {React.ElementType} icon - The icon component to be displayed.
 * @property {string} title - The title of the feature.
 * @property {string} description - A brief description of the feature.
 * @property {string} link - The URL the card should link to.
 * @property {string} linkText - The text to display on the button.
 */
export interface ActionFeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

/**
 * @function ActionFeatureCard
 * @description A reusable card component to display a single feature with a call-to-action link.
 * @param {ActionFeatureCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered feature card.
 */
export const ActionFeatureCard: React.FC<ActionFeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  link,
  linkText,
}) => (
  <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-start gap-4 pb-4">
      <div className="p-3 rounded-md bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <CardTitle className="text-xl mb-1">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="flex-grow" />
    <CardFooter>
      <Button asChild className="w-full group">
        <Link href={link}>
          {linkText}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);
