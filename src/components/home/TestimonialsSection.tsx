import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "Football Enthusiast",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    rating: 5,
    text: "TurfBook has completely changed how I book turfs. The app is super easy to use and I can find great turfs near me in seconds. Highly recommend!",
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Turf Owner",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    rating: 5,
    text: "As a turf owner, this platform has helped me increase my bookings by 60%. The management dashboard is fantastic and the support team is always helpful.",
  },
  {
    id: 3,
    name: "Arjun Reddy",
    role: "Cricket Player",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    rating: 5,
    text: "The collaborative play feature is amazing! I've met so many great players through this platform. Now I never have to worry about incomplete teams.",
  },
  {
    id: 4,
    name: "Sneha Kapoor",
    role: "Badminton Player",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    rating: 4,
    text: "Love the real-time availability feature. No more calling multiple turfs to check slots. Everything is just one click away!",
  },
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="premium" className="mb-4">Testimonials</Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our <span className="text-primary">Users Say</span>
          </h2>
          <p className="text-muted-foreground">
            Join thousands of happy players and turf owners on our platform
          </p>
        </div>

        {/* Testimonials Grid (Desktop) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.id}
              variant="interactive"
              className="animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? "text-primary fill-primary"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-muted-foreground text-sm mb-6 line-clamp-4">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonials Carousel (Mobile) */}
        <div className="md:hidden relative">
          <Card variant="glass" className="overflow-hidden">
            <CardContent className="p-8">
              {/* Rating */}
              <div className="flex gap-1 mb-4 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonials[activeIndex].rating
                        ? "text-primary fill-primary"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground text-center mb-6">
                "{testimonials[activeIndex].text}"
              </p>

              {/* Author */}
              <div className="flex flex-col items-center gap-3">
                <img
                  src={testimonials[activeIndex].avatar}
                  alt={testimonials[activeIndex].name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary"
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
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === activeIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
