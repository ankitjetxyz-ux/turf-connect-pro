import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Building2, IndianRupee, FileText, Globe } from "lucide-react";

interface BasicInfoSectionProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, handleChange }) => {
    return (
        <Card className="glass-card border-white/10 shadow-glow hover:shadow-glow-sm transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary neon-glow">
                    <Building2 className="w-5 h-5" />
                    Basic Information
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    Tell users about your turf. Make it stand out!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground/80">Turf Name <span className="text-destructive">*</span></Label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Elite Sports Arena"
                            value={formData.name}
                            onChange={handleChange}
                            className="pl-9 bg-secondary/30 border-white/10 focus:border-primary/60 focus:ring-primary/20 transition-all duration-300"
                        />
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <Label htmlFor="location" className="text-foreground/80">Location (City/Area) <span className="text-destructive">*</span></Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="location"
                            name="location"
                            placeholder="e.g. Koramangala, Bangalore"
                            value={formData.location}
                            onChange={handleChange}
                            className="pl-9 bg-secondary/30 border-white/10 focus:border-primary/60 focus:ring-primary/20 transition-all duration-300"
                        />
                    </div>
                </div>

                {/* Google Maps Link */}
                <div className="space-y-2">
                    <Label htmlFor="google_maps_link" className="text-foreground/80">Google Maps Link</Label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="google_maps_link"
                            name="google_maps_link"
                            placeholder="https://maps.google.com/..."
                            value={formData.google_maps_link}
                            onChange={handleChange}
                            className="pl-9 bg-secondary/30 border-white/10 focus:border-primary/60 focus:ring-primary/20 transition-all duration-300"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Paste the full Google Maps URL to help users find you easily.
                    </p>
                </div>


                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground/80">Description</Label>
                    <div className="relative">
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Describe your turf facilities, surface type, and what makes it special..."
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="bg-secondary/30 border-white/10 focus:border-primary/60 focus:ring-primary/20 transition-all duration-300 resize-none"
                        />
                    </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                    <Label htmlFor="price_per_slot" className="text-foreground/80">Price per Slot (₹) <span className="text-destructive">*</span></Label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="price_per_slot"
                            name="price_per_slot"
                            type="number"
                            placeholder="e.g. 1500"
                            value={formData.price_per_slot}
                            onChange={handleChange}
                            className="pl-9 bg-secondary/30 border-white/10 focus:border-primary/60 focus:ring-primary/20 transition-all duration-300"
                            min="0"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default BasicInfoSection;
