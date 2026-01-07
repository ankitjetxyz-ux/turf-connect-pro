import { useEffect, useRef, useState } from "react";

interface StatItem {
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
}

interface AnimatedStatsBarProps {
    stats: StatItem[];
    animationDuration?: number;
}

const AnimatedStatsBar = ({ stats, animationDuration = 2000 }: AnimatedStatsBarProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    // Intersection Observer for viewport detection (triggers floating animation)
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    setIsVisible(true);
                    hasAnimated.current = true;
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className="stats-bar-floating w-full max-w-4xl mx-auto my-6"
            style={{
                animation: isVisible ? "floating 3s ease-in-out infinite" : "none",
            }}
        >
            <div className="stats-bar-container">
                <div className="flex items-center justify-around gap-4 px-6 py-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center flex-1 min-w-[100px]">
                            <div className="text-3xl md:text-4xl font-bold font-heading text-foreground">
                                {stat.prefix}
                                {stat.value.toLocaleString()}
                                {stat.suffix}
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1.5 font-medium">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        .stats-bar-container {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.1) 100%);
          border-radius: 16px;
          box-shadow: 
            0 0 20px rgba(34, 197, 94, 0.15),
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .stats-bar-container:hover {
          box-shadow: 
            0 0 30px rgba(34, 197, 94, 0.2),
            0 8px 24px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        @keyframes floating {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .stats-bar-floating {
          will-change: transform;
        }

        @media (max-width: 768px) {
          .stats-bar-container > div {
            flex-direction: column;
            gap: 1.5rem;
          }
        }
      `}</style>
        </div>
    );
};

export default AnimatedStatsBar;
