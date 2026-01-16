import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ImageUploadSectionProps {
    imageFiles: File[];
    setImageFiles: React.Dispatch<React.SetStateAction<File[]>>;
    existingImages?: string[];
    setExistingImages?: React.Dispatch<React.SetStateAction<string[]>>;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ imageFiles, setImageFiles, existingImages = [], setExistingImages }) => {
    const [previews, setPreviews] = useState<string[]>([]);

    // Initialize/Update previews when files or existing images change
    useEffect(() => {
        const filePreviews = imageFiles.map(f => URL.createObjectURL(f));
        // Combine existing (string URLs) + new (blob URLs)
        setPreviews([...existingImages, ...filePreviews]);

        return () => {
            filePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imageFiles, existingImages]);

    // Cleanup object URLs to avoid memory leaks
    // Actually, useEffect cleanup runs when dependencies change too. 
    // Better to just revoke when removing them or unmounting.

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate
        const validFiles = files.filter((file) => {
            const isValidType = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

            if (!isValidType) {
                toast({ title: "Invalid Type", description: `${file.name} is not an image`, variant: "destructive" });
            }
            if (!isValidSize) {
                toast({ title: "File too large", description: `${file.name} exceeds 10MB`, variant: "destructive" });
            }

            return isValidType && isValidSize;
        });

        if (validFiles.length === 0) return;

        const newFiles = [...imageFiles, ...validFiles].slice(0, 10 - existingImages.length);
        setImageFiles(newFiles);
        // Previews are handled by useEffect
    };

    const removeImage = (index: number) => {
        // If index is within existing images range
        if (index < existingImages.length) {
            setExistingImages?.(prev => prev.filter((_, i) => i !== index));
        } else {
            // It's a new file. Adjust index by subtracting existing count
            const fileIndex = index - existingImages.length;
            setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
    };

    return (
        <Card className="glass-card border-white/10 shadow-glow hover:shadow-glow-sm transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary neon-glow">
                    <ImageIcon className="w-5 h-5" />
                    Turf Images
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    Showcase your turf with high-quality photos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-secondary/20 hover:bg-secondary/30 transition-all hover:border-primary/50 group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-primary transition-colors animate-float" />
                            <p className="mb-2 text-sm text-foreground/80 font-medium">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG, WEBP (Max 10MB each, up to 10 images)
                            </p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageChange}
                            disabled={imageFiles.length + existingImages.length >= 10}
                        />
                    </label>
                </div>

                {/* Previews Grid */}
                {previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-fade-in">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 shadow-sm">
                                <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="p-2 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors transform hover:scale-110"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ImageUploadSection;
