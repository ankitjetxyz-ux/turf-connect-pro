import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Quote, User } from "lucide-react";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { homeTestimonials as testimonials } from "@/data/testimonials";

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.9", "center center"]
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity, y }}
      className="py-24 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 dot-pattern opacity-50" />

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-7xl tracking-tight mb-4" style={{ fontFamily: '"Inter Display", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
            Real <span className="text-gradient">Experiences</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Hear directly from players and turf owners about their TurfBook journey
          </p>
        </div>

        {/* Testimonials Marquee (Desktop) */}
        <div className="hidden md:block relative w-full overflow-hidden mask-horizontal-fade py-8">
          {/* Gradient Masks */}
          <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex animate-horizontal-scroll hover:pause-scroll gap-6 w-max">
            {/* Triplicate the list for seamless looping */}
            {[...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
              <Card
                key={`${testimonial.id}-${index}`}
                variant="glass"
                className="w-[300px] shrink-0 glass-card group overflow-hidden hover-lift hover:border-primary/50 hover:shadow-glow"
              >
                <CardContent className="p-0">
                  {/* Post image */}
                  <div className="relative h-40 bg-secondary/30 overflow-hidden">
                    <img
                      src={testimonial.image}
                      alt={`${testimonial.name}'s experience`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                      "{testimonial.text}"
                    </p>

                    <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary/60 transition-colors"
                      />
                      <div>
                        <div className="font-heading font-semibold text-foreground text-sm">
                          {testimonial.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes horizontal-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); } 
          }
          .animate-horizontal-scroll {
            animation: horizontal-scroll 40s linear infinite;
          }
          .hover\\:pause-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>

        {/* Testimonials Carousel (Mobile) */}
        <div className="md:hidden relative">
          <Card variant="glass" className="overflow-hidden glass-card">
            <CardContent className="p-0">
              <div className="relative h-48 bg-secondary/30">
                <img
                  src={testimonials[activeIndex].image}
                  alt={`${testimonials[activeIndex].name}'s experience`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              <div className="p-6">
                <Quote className="w-8 h-8 text-primary/20 mx-auto mb-4" />

                <p className="text-muted-foreground text-center mb-6 leading-relaxed">
                  "{testimonials[activeIndex].text}"
                </p>

                <div className="flex flex-col items-center gap-3">
                  <img
                    src={testimonials[activeIndex].avatar}
                    alt={testimonials[activeIndex].name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary shadow-glow-sm"
                  />
                  <div className="text-center">
                    <div className="font-heading font-semibold text-foreground">
                      {testimonials[activeIndex].name}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {testimonials[activeIndex].role}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={prevTestimonial}
              className="w-11 h-11 rounded-full glass-effect flex items-center justify-center text-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === activeIndex ? "bg-primary w-6" : "bg-muted hover:bg-muted-foreground/50"
                    }`}
                />
              ))}
            </div>
            <button
              onClick={nextTestimonial}
              className="w-11 h-11 rounded-full glass-effect flex items-center justify-center text-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-center mt-12">
        <div className="inline-flex items-center gap-6 bg-secondary/30 px-6 py-3 rounded-full">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="font-semibold">50K+</span>
            <span className="text-sm text-muted-foreground">Happy Users</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default TestimonialsSection;
