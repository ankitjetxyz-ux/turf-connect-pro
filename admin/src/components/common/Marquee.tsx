import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface MarqueeProps {
    text: string;
    speed?: number; // Duration in seconds for one full loop
}

const Marquee = ({ text, speed = 15 }: MarqueeProps) => {
    // We duplicate the text enough times to fill the screen and ensure smooth loop
    const repeatedText = Array(4).fill(text).join(" • ");

    return (
        <div className="w-full overflow-hidden bg-background py-6 border-y border-border/10 relative z-30 -mb-20 md:-mb-24">
            <div className="flex whitespace-nowrap">
                <motion.div
                    className="flex whitespace-nowrap"
                    animate={{
                        x: ["0%", "-50%"],
                    }}
                    transition={{
                        duration: speed,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                    }}
                >
                    {/* Render duplicated sets for seamless loop */}
                    <span className="text-6xl md:text-8xl font-black uppercase text-foreground/10 tracking-tighter px-4" style={{ fontFamily: '"Basement Grotesque", "Inter Display", sans-serif' }}>
                        {repeatedText}
                    </span>
                    <span className="text-6xl md:text-8xl font-black uppercase text-foreground/10 tracking-tighter px-4" style={{ fontFamily: '"Basement Grotesque", "Inter Display", sans-serif' }}>
                        {repeatedText}
                    </span>
                </motion.div>
            </div>
        </div>
    );
};

export default Marquee;
