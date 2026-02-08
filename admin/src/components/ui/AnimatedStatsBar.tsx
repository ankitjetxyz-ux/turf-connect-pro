import { useRef } from "react";
import { motion, useInView, useSpring, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

interface AnimatedStatsBarProps {
  stats: StatItem[];
}

const Counter = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 50,
    duration: 2000,
  });
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.floor(latest).toLocaleString();
      }
    });
  }, [springValue]);

  return <span ref={ref}>0</span>;
};

const AnimatedStatsBar = ({ stats }: AnimatedStatsBarProps) => {
  return (
    <div className="w-full max-w-6xl mx-auto my-12 relative z-10 px-4">
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="stats-box flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 100 }}
              className="text-4xl md:text-6xl font-black font-heading tracking-tight mb-2 flex items-center justify-center gap-1"
              style={{
                textShadow: "0 0 40px rgba(255,255,255,0.1)",
                background: "linear-gradient(to bottom right, #ffffff, #a5a5a5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              {stat.prefix && <span className="text-2xl md:text-4xl opacity-50">{stat.prefix}</span>}
              <Counter value={stat.value} />
              {stat.suffix && <span className="text-2xl md:text-4xl opacity-50">{stat.suffix}</span>}
            </motion.div>
            <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      <style>{`
        .stats-box {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .stats-box:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.03);
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.3);
        }

        .stats-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.05),
            transparent
          );
          animation: shimmer 8s infinite linear;
          pointer-events: none;
        }

        @keyframes shimmer {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedStatsBar;
