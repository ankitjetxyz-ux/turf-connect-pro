import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

export const SOCIAL_LINKS = [
  { 
    label: "Facebook", 
    href: "https://facebook.com/turfbook", 
    icon: Facebook,
    color: "hover:text-blue-500" 
  },
  { 
    label: "Twitter", 
    href: "https://twitter.com/turfbook", 
    icon: Twitter,
    color: "hover:text-sky-400" 
  },
  { 
    label: "Instagram", 
    href: "https://instagram.com/turfbook", 
    icon: Instagram,
    color: "hover:text-pink-500" 
  },
  { 
    label: "LinkedIn", 
    href: "https://linkedin.com/company/turfbook", 
    icon: Linkedin,
    color: "hover:text-blue-700" 
  },
  { 
    label: "Youtube", 
    href: "https://youtube.com/turfbook", 
    icon: Youtube,
    color: "hover:text-red-600" 
  }
];

interface SocialMediaLinksProps {
  className?: string;
  iconSize?: string;
  variant?: "default" | "glass" | "simple";
}

const SocialMediaLinks = ({ className = "", iconSize = "w-5 h-5", variant = "default" }: SocialMediaLinksProps) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      {SOCIAL_LINKS.map(({ label, href, icon: Icon, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`
            transition-all duration-300 flex items-center justify-center
            ${variant === "glass" 
              ? "w-10 h-10 rounded-xl glass-effect text-muted-foreground hover:border-primary/50 hover:shadow-glow-sm" 
              : variant === "simple"
                ? "text-muted-foreground hover:scale-110"
                : "w-10 h-10 rounded-full bg-secondary/50 text-muted-foreground hover:bg-primary/10"
            }
            ${color}
          `}
        >
          <Icon className={iconSize} />
        </a>
      ))}
    </div>
  );
};

export default SocialMediaLinks;
