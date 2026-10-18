import {
  RiGithubLine,
  RiLinkedinLine,
  RiMailLine,
} from "react-icons/ri";
import type { IconType } from "react-icons";

/** Placeholder marker — replace before launch */
export const PLACEHOLDER = "[PLACEHOLDER]" as const;

/** Override at build/deploy with VITE_SITE_URL */
export const siteUrl =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_SITE_URL as string | undefined)) ||
  "https://snigdho48.github.io";

export const siteConfig = {
  name: "MD. Atiquzzaman Snigdho",
  shortName: "Snigdho",
  title: "Software Engineer",
  tagline: "Full-Stack Development | Cloud Solutions",
  email: "atiquzzamansnigdho@gmail.com",
  phone: "+880 1775350203",
  location: "Mohammodpur, Dhaka, Bangladesh",
  linkedin: "https://linkedin.com/in/atiquzzamansnigdho",
  github: "https://github.com/snigdho48",
  cvPath: "/cv/MD.Atiquzzaman_Snigdho.pdf",
  ogImage: "/og-image.webp",
  avatar: "/avatar.webp",
  siteUrl,
  bio: "Software Engineer with 3 years of experience designing, building, and maintaining production-grade backend systems. Specialized in React, Python, Django, REST APIs, background processing, mobile apps with Flutter and data-intensive applications. Strong ownership of core services, database design, performance optimization, and system reliability. Actively mentor junior engineers and enforce clean architecture and backend best practices.",
  headline: "Building production\nbackend systems.",
  availability: "Open to full-time and contract opportunities",
  now: {
    role: "Software Engineer - A Maze Venture",
    location: "Dhaka, Bangladesh",
    status: "Open to work",
  },
  howIWork: [
    "Own production backend systems end-to-end - APIs, workers, data models, and deploys.",
    "Mentor junior engineers through code reviews, architecture guidance, and clean backend standards.",
    "Translate product and ops workflows into reliable services that stay fast under concurrent load.",
  ],
} as const;

export const socialData: Array<{
  name: string;
  link: string;
  Icon: IconType;
}> = [
  { name: "GitHub", link: siteConfig.github, Icon: RiGithubLine },
  { name: "LinkedIn", link: siteConfig.linkedin, Icon: RiLinkedinLine },
  { name: "Email", link: `mailto:${siteConfig.email}`, Icon: RiMailLine },
];

export const navSections = [
  { id: "hero", label: "Home" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

export type ExperienceItem = {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
};

export const experience: ExperienceItem[] = [
  {
    role: "Software Engineer",
    company: "A Maze Venture",
    location: "Niketon, Gulshan",
    period: "09/2023 - Present",
    bullets: [
      "Core backend engineer for Braincount, an enterprise campaign monitoring and analytics platform.",
      "Designed Django REST APIs for campaign management, monitoring logs, assets, and reporting.",
      "Built background workers using Celery and Redis for data processing and scheduled tasks.",
      "Optimized database queries and indexes to handle large monitoring datasets efficiently.",
      "Ensured API performance, stability, and scalability across concurrent campaigns.",
      "Directed and supported junior developers using modern frameworks such as Angular and Node.js.",
      "Collaborated with frontend, product, and operations teams to translate business workflows into backend services.",
      "Reviewed code, guided junior developers, and enforced backend engineering standards.",
      "Supported production deployments and monitored live systems on Linux servers.",
    ],
  },
  {
    role: "Junior Software Engineer",
    company: "Mysoftheaven",
    location: "Pirerbag, Mirpur-2",
    period: "02/2023 - 08/2023",
    bullets: [
      "Developed mobile apps.",
      "Integrated backend services with Flutter mobile apps.",
      "Improved application performance and data consistency.",
      "Participated in testing, deployment, and production support.",
    ],
  },
  {
    role: "Software Engineer Intern",
    company: "Machine Xtreme LLC",
    location: "Mirpur-10",
    period: "06/2018 - 11/2018",
    bullets: [
      "Developed mobile apps.",
      "Integrated backend services with Flutter mobile apps.",
      "Improved application performance and data consistency.",
      "Contributed to a customer support chatbot using AI technologies, enhancing customer service response times by 40%.",
    ],
  },
];

export type SkillGroup = {
  title: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    title: "System Architecture & Design",
    items: ["Microservices", "API design", "Database modeling", "Scalability planning"],
  },
  {
    title: "Backend Development",
    items: ["Django", "Flask", "Node.js / Express", "REST", "GraphQL"],
  },
  {
    title: "Frontend Technologies",
    items: ["React.js", "TypeScript", "Responsive UI/UX", "Redux", "Tailwind CSS", "Material UI", "Chakra UI"],
  },
  {
    title: "Mobile Development",
    items: ["Flutter / Dart", "Cross-platform apps", "Firebase", "GetX"],
  },
  {
    title: "Data & Performance",
    items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Caching", "Query optimization"],
  },
  {
    title: "Cloud & DevOps",
    items: ["AWS (EC2, S3, RDS)", "Docker", "Nginx", "DigitalOcean", "GitLab CI/CD", "Linux"],
  },
  {
    title: "Leadership & Mentorship",
    items: ["Code reviews", "Junior developer coaching", "Agile practices"],
  },
];

export const education = {
  degree: "B.Sc in Computer Science & Engineering",
  school: "Daffodil International University (DIU)",
  period: "01/2018 - 01/2022",
  location: "Dhaka",
  gpa: "3.12 / 4.0",
} as const;

export const languages = [
  { name: "Bangla", level: "Native" },
  { name: "English", level: "Advanced" },
] as const;

export type ProjectNodeId =
  | "api"
  | "worker"
  | "db"
  | "cache"
  | "realtime"
  | "mobile"
  | "cloud";

export type ProjectScreenshot = {
  src: string;
  alt: string;
  isPlaceholder: boolean;
  /** Image already contains its own device frame / marketing mock-up: never wrap it in another frame. */
  framed?: boolean;
};

export type Project = {
  slug: string;
  title: string;
  liveUrl: string;
  purpose: string;
  contributions: string[];
  stack: string[];
  nodeIds: ProjectNodeId[];
  screenshots: ProjectScreenshot[];
  contributionsArePlaceholder?: boolean;
};

export function placeholderShots(
  slug: string,
  title: string,
  count = 3,
): ProjectScreenshot[] {
  return Array.from({ length: count }, (_, i) => ({
    src: `/projects/placeholders/${slug}-${i + 1}.svg`,
    alt: `[PLACEHOLDER] ${title} screenshot ${i + 1} of ${count} - replace with real capture`,
    isPlaceholder: true,
  }));
}

export function realShots(
  slug: string,
  title: string,
  count: number,
  framed = false,
): ProjectScreenshot[] {
  return Array.from({ length: count }, (_, i) => ({
    src: `/projects/${slug}/frame-${i + 1}.webp`,
    alt: `${title} screenshot ${i + 1}`,
    isPlaceholder: false,
    ...(framed ? { framed: true } : {}),
  }));
}

export const projects: Project[] = [
  {
    slug: "braincount",
    title: "Braincount",
    liveUrl: "https://braincount.net/",
    purpose:
      "Outdoor audience measurement, asset monitoring, and OOH planning platform using location data, IoT, and AI to measure real billboard visibility.",
    contributions: [
      "Co-developed Bangladesh's first data-driven OOH advertising intelligence platform.",
      "Designed and implemented backend services to process location-based and IoT-derived campaign data.",
      "Built RESTful APIs for campaign configuration, monitoring, and analytics reporting.",
      "Implemented background data processing pipelines using Celery and Redis.",
      "Developed analytics services to measure audience exposure, campaign reach, and ROI.",
      "Ensured real-time performance analytics for ongoing campaigns.",
      "Optimized database schemas and queries to support large datasets and concurrent campaigns.",
      "Supported production deployments and monitored live systems.",
      "Collaborated with frontend and operations teams to convert business requirements into backend services.",
    ],
    stack: ["Python", "Django", "DRF", "MySQL", "React", "HeroUI", "Flutter"],
    nodeIds: ["api", "worker", "db", "cache", "cloud"],
    screenshots: realShots("braincount", "Braincount", 3),
  },
  {
    slug: "papercable",
    title: "Papercable",
    liveUrl: "https://papercable.com/",
    purpose:
      "Data-driven PR platform with real-time analytics and publishing for tracking media engagement and campaign effectiveness.",
    contributions: [
      "Engineered analytics pipelines to collect and process media engagement data.",
      "Built backend APIs to support campaign tracking and reporting dashboards.",
      "Designed database models to store campaign performance and outreach metrics.",
      "Integrated backend services with frontend dashboards for real-time insights.",
      "Enabled data-backed decision-making for PR and media strategies.",
      "Designed frontend and implemented APIs.",
    ],
    stack: ["Django", "MySQL", "REST APIs", "React", "Material UI"],
    nodeIds: ["api", "db", "cloud"],
    screenshots: realShots("papercable", "Papercable", 1),
  },
  {
    // Added at the user's explicit request (not on the CV). Facts below come from the public Google Play listing
    // (com.maaty.app, publisher "maaty by Eurostar"); everything else is a [PLACEHOLDER].
    slug: "maaty",
    title: "Maaty",
    liveUrl: "https://play.google.com/store/apps/details?id=com.maaty.app&hl=en",
    purpose:
      "Your smart AI shopping agent for groceries, Q Coins, deals and savings in Qatar - a Flutter app backed by a Django chat service (OpenAI, pgvector search) and an inventory/orders API.",
    contributions: [
      "[PLACEHOLDER] Contribution bullet 1 - replace with your Maaty work.",
      "[PLACEHOLDER] Contribution bullet 2 - replace with your Maaty work.",
      "[PLACEHOLDER] Contribution bullet 3 - replace with your Maaty work.",
    ],
    stack: ["Flutter", "GetX", "Django", "PostgreSQL", "pgvector", "OpenAI", "Channels"],
    nodeIds: ["mobile"],
    contributionsArePlaceholder: true,
    screenshots: realShots("maaty", "Maaty", 6, true),
  },
  {
    // Added at the user's request (not on the CV). Only the description comes from the public site
    // (reachableads.com); role, contributions and stack are [PLACEHOLDER] until verified.
    slug: "reachable",
    title: "Reachable",
    liveUrl: "https://reachableads.com/",
    purpose:
      "A global, performance-focused demand-side platform for programmatic media buying, delivering premium, brand-safe impressions at efficient CPMs through AI, real-time bidding, and automated optimization (from the Reachable website).",
    contributions: [
      "[PLACEHOLDER] Contribution bullet 1 - replace with your Reachable work.",
      "[PLACEHOLDER] Contribution bullet 2 - replace with your Reachable work.",
      "[PLACEHOLDER] Contribution bullet 3 - replace with your Reachable work.",
    ],
    stack: ["[PLACEHOLDER]"],
    nodeIds: ["api"],
    contributionsArePlaceholder: true,
    screenshots: realShots("reachable", "Reachable", 1),
  },  {
    slug: "omnichannel",
    title: "Omnichannel",
    liveUrl: "https://omni.reachableads.com/",
    purpose:
      "Monitor all campaign accounts in one place - a multi-platform advertising dashboard that aggregates ReachableAds DSP/SSP, Google Ads and Meta reporting behind one REST API.",
    contributions: [
      "Developed frontend and backend services for campaign planning, execution, and tracking.",
      "Built APIs to aggregate performance data from multiple channels.",
      "Implemented real-time performance monitoring for active campaigns.",
      "Optimized backend workflows to support scalable, concurrent campaign operations.",
      "Collaborated with frontend teams to deliver end-to-end campaign management tools.",
    ],
    stack: ["Django", "DRF", "MySQL", "Redis", "Celery", "React", "Redux Toolkit"],
    nodeIds: ["api", "db", "realtime", "cloud"],
    screenshots: realShots("omnichannel", "Omnichannel", 1),
  },
  {
    slug: "dbid",
    title: "DBID",
    liveUrl:
      "https://play.google.com/store/apps/details?id=com.mysoftheaven.dbid&hl=en",
    purpose:
      "A secure digital identity solution enabling users to manage personal information and application processes safely.",
    contributions: [
      "Developed backend modules for authentication and account verification.",
      "Designed secure data storage and access mechanisms.",
      "Integrated backend services with Flutter-based mobile frontend.",
      "Contributed to application tracking and identity verification workflows.",
      "Ensured data integrity and security best practices.",
    ],
    stack: [
      "Flutter",
      "Firebase",
      "Authentication Systems",
      "Push Notifications",
      "GetX",
    ],
    nodeIds: ["mobile", "api", "cloud"],
    screenshots: realShots("dbid", "DBID", 4),
  },
  {
    slug: "authentiqa",
    title: "Authentiqa",
    liveUrl: "https://authentiqa.net/",
    purpose:
      "Product authentication platform: an admin console and public verify UI backed by separate core, QR-code and scan-tracking APIs.",
    contributions: [
      "[PLACEHOLDER] Contribution bullet 1 - replace with your Authentiqa work.",
      "[PLACEHOLDER] Contribution bullet 2 - replace with your Authentiqa work.",
      "[PLACEHOLDER] Contribution bullet 3 - replace with your Authentiqa work.",
    ],
    stack: ["Next.js", "React", "Django", "Django Ninja", "PostgreSQL", "Celery", "Redis"],
    nodeIds: ["api", "db", "cloud"],
    contributionsArePlaceholder: true,
    screenshots: realShots("authentiqa", "Authentiqa", 1),
  },
  {
    slug: "pr-tools",
    title: "PR Tools",
    liveUrl: "https://prtools.reachableads.com",
    purpose:
      "EDDY by Papercable - an AI-assisted PR writing tool that takes a brand from research to write, media, preview and publish, with Bangla input support.",
    contributions: [
      "[PLACEHOLDER] Contribution bullet 1 - replace with your PR Tools work.",
      "[PLACEHOLDER] Contribution bullet 2 - replace with your PR Tools work.",
      "[PLACEHOLDER] Contribution bullet 3 - replace with your PR Tools work.",
    ],
    stack: ["Django", "React", "PostgreSQL", "Celery", "Gemini", "pgvector", "Redis", "Channels", "Tailwind CSS"],
    nodeIds: ["api", "db", "worker"],
    contributionsArePlaceholder: true,
    screenshots: realShots("pr-tools", "PR Tools", 1),
  },
];

export const graphNodes: Array<{
  id: ProjectNodeId;
  label: string;
  x: number;
  y: number;
}> = [
  { id: "api", label: "API", x: 50, y: 22 },
  { id: "worker", label: "Workers", x: 78, y: 38 },
  { id: "db", label: "DB", x: 72, y: 68 },
  { id: "cache", label: "Cache", x: 42, y: 78 },
  { id: "realtime", label: "Realtime", x: 18, y: 58 },
  { id: "mobile", label: "Mobile", x: 16, y: 30 },
  { id: "cloud", label: "Cloud", x: 50, y: 48 },
];

export const graphEdges: Array<[ProjectNodeId, ProjectNodeId]> = [
  ["api", "cloud"],
  ["api", "db"],
  ["api", "cache"],
  ["worker", "cache"],
  ["worker", "db"],
  ["realtime", "api"],
  ["mobile", "api"],
  ["cloud", "db"],
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAdjacentProjects(slug: string): {
  prev?: Project;
  next?: Project;
} {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i < 0) return {};
  return {
    prev: projects[i - 1],
    next: projects[i + 1],
  };
}
