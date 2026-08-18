import {
  Users,
  Wheat,
  Droplets,
  Tractor,
  GraduationCap,
  LineChart,
  Banknote,
  Landmark,
  Wallet,
  UserRound,
  MonitorSmartphone,
  type LucideIcon,
} from "lucide-react";

export const STRUCTURE_LEVELS = [
  "National Headquarters",
  "6 Geopolitical Zonal Offices",
  "State Chapters",
  "Local Government Area (LGA) Chapters",
  "Community / Ward Units",
  "Farmer Clusters / Primary Cooperatives",
  "Individual Members",
];

export type WhatWeDoItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const WHAT_WE_DO: WhatWeDoItem[] = [
  {
    icon: Users,
    title: "Farmer Mobilization & Organization",
    description:
      "We mobilize farmers into structured cooperative groups and clusters to improve coordination, programme participation, collective bargaining, produce aggregation, and market opportunities.",
  },
  {
    icon: Wheat,
    title: "Agricultural Production",
    description:
      "Supporting farmers across strategic commodities including rice, maize, wheat, vegetables, legumes, and other commercially viable crops.",
  },
  {
    icon: Droplets,
    title: "Irrigation & Year-Round Farming",
    description:
      "Promoting solar and petrol-powered water pumps, irrigation infrastructure, and efficient water management to extend production beyond the rainy season.",
  },
  {
    icon: Tractor,
    title: "Agricultural Mechanisation",
    description:
      "Improving access to tractors, power tillers, planters, harvesters, threshers, processing equipment, and other appropriate machinery.",
  },
  {
    icon: GraduationCap,
    title: "Extension & Advisory Services",
    description:
      "Technical training on good agricultural practices, land preparation, pest and disease management, climate-smart farming, and post-harvest management.",
  },
  {
    icon: LineChart,
    title: "Agribusiness & Market Development",
    description:
      "Connecting farmers to markets through produce aggregation, off-taker relationships, processor linkages, value-chain, and contract farming opportunities.",
  },
  {
    icon: Banknote,
    title: "Access to Agricultural Finance",
    description:
      "Facilitating connections between eligible farmers and legitimate agricultural finance and investment opportunities. FFFCSL does not seek to replace regulated financial institutions.",
  },
  {
    icon: MonitorSmartphone,
    title: "Agricultural Technology & Data",
    description:
      "Building digital systems for farmer registration, membership management, farm records, and reliable agricultural data to guide programme delivery.",
  },
];

export type Department = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const DEPARTMENTS: Department[] = [
  {
    icon: Landmark,
    title: "Administration & Human Resources",
    description:
      "Provides the institutional and administrative framework required for effective operation of the Federation — general administration, HR, staff coordination, internal communication, and institutional policy implementation.",
  },
  {
    icon: Wallet,
    title: "Finance & Accounts",
    description:
      "Responsible for budgeting, financial planning, accounting, financial records, expenditure monitoring, internal controls, and financial accountability.",
  },
  {
    icon: UserRound,
    title: "Membership & Mobilization",
    description:
      "Responsible for farmer registration, membership development, mobilization, verification, cooperative organization, cluster development, and membership database management.",
  },
  {
    icon: GraduationCap,
    title: "Extension & Advisory Services",
    description:
      "Provides farmer training, agricultural advisory services, demonstration activities, field visits, production monitoring, and technical recommendations.",
  },
  {
    icon: LineChart,
    title: "Agribusiness & Marketing",
    description:
      "Connects farmers with commercial opportunities through market development, produce aggregation, off-taker relationships, and value-chain development.",
  },
  {
    icon: MonitorSmartphone,
    title: "ICT & Innovation",
    description:
      "Supports digital transformation through farmer database management, digital membership systems, the FFFCSL Digital Farmer Platform, and agricultural information systems.",
  },
];

export const CORE_OBJECTIVES = [
  "Enhance agricultural productivity through training, extension services, improved inputs, irrigation, mechanisation, and modern agricultural practices.",
  "Promote year-round agricultural production through irrigation development and climate-smart farming.",
  "Organize farmers into effective cooperative structures and production clusters.",
  "Facilitate access to quality agricultural inputs and appropriate mechanisation.",
  "Strengthen access to legitimate agricultural finance, credit-support mechanisms, and investment opportunities.",
  "Develop structured relationships between farmers, aggregators, processors, and credible off-takers.",
  "Encourage produce aggregation, value addition, processing, and improved market access.",
  "Promote transparency, accountability, good governance, and responsible cooperative management.",
  "Increase meaningful participation of youth and women in agriculture.",
  "Promote digital technology, agricultural innovation, and data-driven programme management.",
  "Strengthen agricultural extension and farmer capacity development.",
  "Support climate-resilient and environmentally sustainable agricultural practices.",
  "Develop productive partnerships with government institutions, development organizations, research institutions, financial institutions, and responsible private-sector organizations.",
  "Improve the economic livelihoods and resilience of farmers and rural communities.",
  "Contribute meaningfully to Nigeria's agricultural development and national food security.",
];

export const STRATEGIC_FOCUS_AREAS = [
  {
    title: "Farmer Development",
    description: "Building knowledgeable, organized, productive, and commercially oriented farmers.",
  },
  {
    title: "Agricultural Mechanisation",
    description: "Expanding access to equipment and technology that improve production efficiency.",
  },
  {
    title: "Irrigation & Year-Round Farming",
    description: "Supporting production beyond the traditional rainy season.",
  },
  {
    title: "Agricultural Finance",
    description: "Helping eligible farmers connect with appropriate and legitimate financing opportunities.",
  },
  {
    title: "Market Access",
    description: "Connecting agricultural production with reliable markets and value-chain opportunities.",
  },
  {
    title: "Extension Services",
    description: "Providing practical technical knowledge and continuous field support.",
  },
  {
    title: "Digital Agriculture",
    description: "Using technology and reliable agricultural data to improve farmer management and programme delivery.",
  },
  {
    title: "Climate-Smart Agriculture",
    description: "Encouraging practices and technologies that improve resilience, resource efficiency, and long-term sustainability.",
  },
  {
    title: "Youth & Women Empowerment",
    description: "Creating opportunities for young people and women to participate meaningfully in agriculture and agribusiness.",
  },
  {
    title: "Strategic Partnerships",
    description: "Building productive relationships with institutions that contribute expertise, technology, finance, markets, research, and infrastructure.",
  },
];
