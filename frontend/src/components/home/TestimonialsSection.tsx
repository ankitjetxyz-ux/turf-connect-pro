import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronLeft, ChevronRight, Quote, Play, ThumbsUp, User } from "lucide-react";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const testimonials = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "Football Enthusiast",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    rating: 5,
    text: "TurfBook has completely changed how I book turfs. The app is super easy to use and I can find great turfs near me in seconds. Highly recommend!",
    videoSrc: "/videos/testimonial1.mp4",
    thumbnail: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=300&fit=crop",
    duration: "1:45"
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Turf Owner",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    rating: 5,
    text: "As a turf owner, this platform has helped me increase my bookings by 60%. The management dashboard is fantastic and the support team is always helpful.",
    videoSrc: "/videos/testimonial2.mp4",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    duration: "2:15"
  },
  {
    id: 3,
    name: "Arjun Reddy",
    role: "Cricket Player",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    rating: 5,
    text: "The collaborative play feature is amazing! I've met so many great players through this platform. Now I never have to worry about incomplete teams.",
    videoSrc: "/videos/testimonial3.mp4",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    duration: "1:30"
  },
  {
    id: 4,
    name: "Sneha Kapoor",
    role: "Badminton Player",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    rating: 4,
    text: "Love the real-time availability feature. No more calling multiple turfs to check slots. Everything is just one click away!",
    videoSrc: "/videos/testimonial3.mp4",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    duration: "1:30"
  },
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleVideoPlay = (id: number) => {
    setActiveVideo(id);
  };

  const handleVideoClose = () => {
    setActiveVideo(null);
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
            Watch <span className="text-gradient">Real Experiences</span>
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
                className="w-[300px] shrink-0 glass-card group overflow-hidden hover-lift hover:border-primary/50 hover:shadow-glow cursor-pointer"
              >
                <CardContent className="p-0">
                  {/* Video Thumbnail */}
                  <div className="relative h-40 bg-secondary/30 overflow-hidden">
                    <div className="relative h-full">
                      <img
                        src={testimonial.thumbnail}
                        alt={testimonial.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <button
                        onClick={() => handleVideoPlay(testimonial.id)}
                        className="absolute inset-0 flex items-center justify-center group/play"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center group-hover/play:scale-110 transition-transform shadow-lg">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {testimonial.duration}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Rating */}


                    {/* Quote */}
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                      "{testimonial.text}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                      <div className="relative">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-9 h-9 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary/60 transition-colors"
                        />
                      </div>
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
              {/* Video Thumbnail */}
              <div className="relative h-48 bg-secondary/30">
                <div className="relative h-full">
                  <img
                    src={testimonials[activeIndex].thumbnail}
                    alt={testimonials[activeIndex].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <button
                    onClick={() => handleVideoPlay(testimonials[activeIndex].id)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-xl">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded">
                      {testimonials[activeIndex].duration}
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-primary/20 mx-auto mb-4" />

                {/* Rating */}


                {/* Quote */}
                <p className="text-muted-foreground text-center mb-6 leading-relaxed">
                  "{testimonials[activeIndex].text}"
                </p>

                {/* Author */}
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

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={handleVideoClose}
              className="absolute -top-12 right-0 text-white hover:text-primary transition-colors text-lg"
            >
              ✕ Close
            </button>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={testimonials.find(t => t.id === activeVideo)?.videoSrc}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
            <div className="mt-4 text-white text-center">
              <p className="font-semibold">{testimonials.find(t => t.id === activeVideo)?.name}</p>
              <p className="text-sm text-gray-300">{testimonials.find(t => t.id === activeVideo)?.role}</p>
            </div>
          </div>
        </div>
      )}

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