import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Sparkles } from "lucide-react";
import api from "@/services/api";
import { motion, useScroll, useTransform } from "framer-motion";

interface PromotionalVideo {
  id: string;
  title?: string;
  video_url: string;
  thumbnail_url?: string;
  display_order: number;
}

const PromotionalVideos = () => {
  const [videos, setVideos] = useState<PromotionalVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.get("/promotional-videos");
        setVideos(res.data || []);
      } catch (error) {
        console.error("Failed to load promotional videos", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading || videos.length === 0) {
    return null;
  }

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
      className="py-16 md:py-24 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
      <div className="container px-4 relative z-10">
        <div className="text-center mb-12 space-y-4">
          <Badge variant="premium" className="px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Featured Content
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            <span className="text-gradient">Promotional Videos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Watch our featured videos and discover what makes us special
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <Card
              key={video.id}
              className="group overflow-hidden hover-lift glass-card border-white/10 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative aspect-video overflow-hidden bg-secondary/20">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title || "Promotional video"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Play className="w-16 h-16 text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  </div>
                </div>
                <button
                  onClick={() => window.open(video.video_url, '_blank')}
                  className="absolute inset-0 w-full h-full"
                  aria-label={`Play ${video.title || 'video'}`}
                />
              </div>
              {video.title && (
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {video.title}
                  </h3>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default PromotionalVideos;

