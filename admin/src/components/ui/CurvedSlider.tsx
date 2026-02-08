
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import img1 from "@/assets/slider/722d28138aafca4ab215baa53d7aca11.jpg";
import img2 from "@/assets/slider/8hoSXWYKbogOvxsFQ1wK6ABTU4bd31.png";
import img3 from "@/assets/slider/Ss1GauvsBBmN8xmgKypuDJsz5KE75d1.png";

const images = [img1, img2, img3];

const CurvedSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[800px] flex items-center justify-center perspective-[1000px]">
            <div className="relative w-[480px] h-[720px]">
                <AnimatePresence mode='popLayout'>
                    {images.map((img, index) => {
                        // Calculate relative position based on currentIndex
                        const position = (index - currentIndex + images.length) % images.length;

                        // We only show 3 active cards for the stack effect
                        if (position > 2) return null;

                        const isFront = position === 0;

                        return (
                            <motion.div
                                key={img}
                                initial={false}
                                animate={{
                                    scale: isFront ? 1 : 0.9 - position * 0.05,
                                    x: position * 80, // Horizontal stack offset
                                    y: 0,
                                    z: -position * 50,
                                    opacity: 1 - position * 0.1,
                                    rotateY: position * -5, // Horizontal curve effect
                                    rotateX: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                    x: -300, // Slide out horizontally
                                    transition: { duration: 0.5 }
                                }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                                style={{
                                    zIndex: images.length - position,
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                <div className="absolute inset-0 bg-black/20 z-10" />
                                <img
                                    src={img}
                                    alt="Turf"
                                    className="w-full h-full object-cover"
                                />
                                {/* Gloss effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent z-20 pointer-events-none" />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CurvedSlider;
