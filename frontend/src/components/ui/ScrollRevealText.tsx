import { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

interface ScrollRevealTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
}

const ScrollRevealText = ({ text, className, style }: ScrollRevealTextProps) => {
    const container = useRef(null);
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ["start 0.9", "start 0.25"], // Start revealing when top is 90% of viewport, end when top is 25%
    });

    const words = text.split(" ");

    return (
        <h2 ref={container} className={className} style={style}>
            {words.map((word, i) => {
                const start = i / words.length;
                const end = start + 1 / words.length;
                return (
                    <Word key={i} progress={scrollYProgress} range={[start, end]}>
                        {word}
                    </Word>
                );
            })}
        </h2>
    );
};

const Word = ({
    children,
    progress,
    range,
}: {
    children: string;
    progress: MotionValue<number>;
    range: [number, number];
}) => {
    const opacity = useTransform(progress, range, [0.1, 1]); // Start at 0.1 opacity, go to 1

    return (
        <span className="relative mx-1 lg:mx-2.5 inline-block">
            <span className="absolute opacity-10">{children}</span> {/* Shadow/Ghost text for layout */}
            <motion.span style={{ opacity: opacity }}>{children}</motion.span>
        </span>
    );
};

export default ScrollRevealText;
