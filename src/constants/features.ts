import {
    FaSearch,
    FaLightbulb,
    FaChartLine,
    FaUsers,
    FaMobileAlt,
    FaClock,
} from "react-icons/fa";
import { Feature, Stat } from "@/types";

/**
 * @const FEATURES
 * @description An array of objects, where each object represents a key feature of the application.
 * Each feature has an icon, a title, and a description.
 * @type {Feature[]}
 */
export const FEATURES: Feature[] = [
    {
        icon: FaSearch,
        title: "Smart Search",
        description:
            "Find problems by difficulty, topic, company, or keywords. Our intelligent search helps you focus on what matters most.",
    },
    {
        icon: FaLightbulb,
        title: "Detailed Solutions",
        description:
            "Step-by-step explanations with multiple approaches, time complexity analysis, and optimization tips.",
    },
    {
        icon: FaChartLine,
        title: "Progress Tracking",
        description:
            "Monitor your learning journey with detailed analytics and personalized recommendations.",
    },
    {
        icon: FaUsers,
        title: "Community Driven",
        description:
            "Learn from thousands of developers sharing their solutions and interview experiences.",
    },
    {
        icon: FaMobileAlt,
        title: "Mobile Friendly",
        description:
            "Practice anywhere, anytime with our responsive design that works perfectly on all devices.",
    },
    {
        icon: FaClock,
        title: "Regular Updates",
        description:
            "Stay current with the latest problems and solutions added weekly from top tech companies.",
    },
];

/**
 * @const STATS
 * @description An array of objects representing key statistics about the application.
 * Each stat has a number and a label.
 * @type {Stat[]}
 */
export const STATS: Stat[] = [
    { number: "2000+", label: "Problems Available" },
    { number: "5K+", label: "Active Users" },
    { number: "95%", label: "Success Rate" },
    { number: "500+", label: "Companies Covered" },
];
