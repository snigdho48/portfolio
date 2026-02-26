import {
  RiGithubLine,
  RiLinkedinLine,
  RiMailLine,
} from "react-icons/ri";
import {
  HiCode,
  HiServer,
  HiDeviceMobile,
  HiCloud,
  HiTerminal,
} from "react-icons/hi";
import {
  FaPython,
  FaReact,
  FaNodeJs,
  FaDocker,
  FaAws,
  FaGitAlt,
} from "react-icons/fa";
import {
  SiDjango,
  SiFlask,
  SiTypescript,
  SiPostgresql,
  SiMysql,
  SiMongodb,
  SiRedis,
  SiTailwindcss,
  SiFlutter,
} from "react-icons/si";
import type { IconType } from "react-icons";

export const siteConfig = {
  name: "MD. Atiquzzaman Snigdho",
  shortName: "Snigdho",
  title: "Software Engineer",
  tagline: "Backend Systems · Full-Stack · Cloud",
  email: "atiquzzamansnigdho@gmail.com",
  phone: "+880 1775350203",
  location: "Mohammodpur, Dhaka, Bangladesh",
  linkedin: "https://linkedin.com/in/atiquzzamansnigdho",
  github: "https://github.com/atiquzzamansnigdho",
  bio: "Software Engineer with 3+ years of experience building and maintaining production-grade backend systems. Specialized in Django, React, REST APIs, background processing, mobile apps with Flutter and data-intensive applications.",
} as const;

export const stats = [
  { end: 3, suffix: "+", label: "Years of experience" },
  { end: 5, suffix: "+", label: "Production projects" },
  { end: 3, suffix: "", label: "Companies worked" },
  { end: 1, suffix: "", label: "CS Degree" },
] as const;

export type SkillGroup = {
  title: string;
  icons: IconType[];
};

export type AboutTab = {
  title: string;
  info: Array<{ title: string; stage?: string; icons?: IconType[] }>;
};

export const aboutData: AboutTab[] = [
  {
    title: "skills",
    info: [
      { title: "Backend", icons: [FaPython, SiDjango, SiFlask, FaNodeJs] },
      { title: "Frontend", icons: [FaReact, SiTypescript, SiTailwindcss] },
      { title: "Mobile", icons: [SiFlutter] },
      { title: "Databases", icons: [SiPostgresql, SiMysql, SiMongodb, SiRedis] },
    ],
  },
  {
    title: "experience",
    info: [
      { title: "Software Engineer — A Maze Venture", stage: "09/2023 – Present" },
      { title: "Junior Software Engineer — Mysoftheaven", stage: "02/2023 – 08/2023" },
      { title: "Intern — Machine Xtreme LLC", stage: "2018 – 2021" },
    ],
  },
  {
    title: "credentials",
    info: [
      { title: "B.Sc in Computer Science & Engineering — Daffodil International University", stage: "01/2018 – 01/2022" },
      { title: "GPA: 3.12 / 4.0", stage: "" },
    ],
  },
];

export const services = [
  {
    Icon: HiServer,
    title: "Backend Development",
    description: "Scalable REST/GraphQL APIs with Django, Flask or Node.js. Background processing with Celery & Redis.",
  },
  {
    Icon: HiCode,
    title: "Full-Stack Development",
    description: "End-to-end web applications using React, TypeScript, Tailwind CSS paired with Python backends.",
  },
  {
    Icon: HiDeviceMobile,
    title: "Mobile Development",
    description: "Cross-platform mobile apps with Flutter/Dart, integrated with robust backend services.",
  },
  {
    Icon: HiTerminal,
    title: "API Design & Architecture",
    description: "Designing RESTful and GraphQL APIs with authentication, rate limiting, and high-performance patterns.",
  },
  {
    Icon: HiCloud,
    title: "Cloud & DevOps",
    description: "CI/CD pipelines, Docker containers, AWS deployment, DigitalOcean, Nginx configuration.",
  },
];

export type ProjectImage = {
  title: string;
  color: string;
  link: string;
};

export const workSlides = {
  slides: [
    {
      images: [
        { title: "Braincount", color: "#1a1a2e", link: "https://braincount.net/" },
        { title: "Papercable", color: "#16213e", link: "https://papercable.com/" },
        { title: "Chobirbaksho", color: "#0f3460", link: "https://chobirbaksho.com" },
        { title: "Omnichannel", color: "#1a1a2e", link: "https://omni.reachableads.com/" },
      ],
    },
    {
      images: [
        { title: "DBID App", color: "#16213e", link: "https://play.google.com/store/apps/details?id=com.mysoftheaven.dbid" },
        { title: "API Platform", color: "#0f3460", link: "#" },
        { title: "Analytics Dashboard", color: "#1a1a2e", link: "#" },
        { title: "Backend Systems", color: "#16213e", link: "#" },
      ],
    },
  ],
};

export const projectDescriptions: Record<string, string> = {
  "Braincount": "Bangladesh's first OOH advertising intelligence platform. Django APIs, Celery, Redis.",
  "Papercable": "Data-driven PR & media outreach tool. Django, MySQL, React, analytics pipelines.",
  "Chobirbaksho": "AI-assisted content creation. Celery, Socket.io, REST APIs, React.",
  "Omnichannel": "Multi-channel marketing dashboard. Django, MySQL, React, real-time monitoring.",
  "DBID App": "Secure digital identity app. Flutter, Firebase, authentication & push notifications.",
  "API Platform": "REST/GraphQL API design & development for enterprise clients.",
  "Analytics Dashboard": "Real-time analytics dashboards with data visualization.",
  "Backend Systems": "High-performance backend systems with Django & PostgreSQL.",
};

export const socialData = [
  { name: "GitHub",   link: siteConfig.github,   Icon: RiGithubLine },
  { name: "LinkedIn", link: siteConfig.linkedin,  Icon: RiLinkedinLine },
  { name: "Email",    link: `mailto:${siteConfig.email}`, Icon: RiMailLine },
];

export const techStack = [FaPython, SiDjango, FaReact, SiTypescript, FaNodeJs, SiFlutter, SiPostgresql, SiRedis, FaDocker, FaAws, FaGitAlt];
