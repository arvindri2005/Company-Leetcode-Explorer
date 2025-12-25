/**
 * @description Props for the FeatureCard component.
 */
export interface FeatureCardProps {
  icon: any; // Accept any to allow passing icon component type
  title: string;
  description: string;
}

/**
 * @description Props for the StatItem component.
 */
export interface StatItemProps {
  number: string;
  label: string;
}

/**
 * @description Represents a feature of the application.
 */
export interface Feature {
  icon: any; // Accept any to allow passing icon component type
  title: string;
  description: string;
}

/**
 * @description Represents a statistic about the application.
 */
export interface Stat {
  number: string;
  label: string;
}
