import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, IndianRupee, Image, Building2, X, Upload } from "lucide-react";

const AddTurfPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    price_per_slot: "",
    facilities: "",
    images: "",
    google_maps_link: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types and size
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image format`,
          variant: "destructive",
        });
      }
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
      }
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    // Update files and previews
    const newFiles = [...imageFiles, ...validFiles].slice(0, 10); // Max 10 images
    setImageFiles(newFiles);

    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke old preview URL
    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.location || !form.price_per_slot) {
      toast({
        title: "Missing fields",
        description: "Name, location and price are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let imagesArray: string[] = [];

      // Upload files if any
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        imageFiles.forEach(file => {
          formData.append("images", file);
        });

        const uploadRes = await api.post("/turfs/upload-images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imagesArray = uploadRes.data.image_urls || [];
        setUploadingImages(false);
      }

      // Also include any manual URLs
      if (form.images) {
        const urlArray = form.images
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url.length > 0);
        imagesArray = [...imagesArray, ...urlArray];
      }

      await api.post("/turfs", {
        ...form,
        price_per_slot: Number(form.price_per_slot),
        images: imagesArray,
      });

      toast({
        title: "Turf Added 🎉",
        description: "Your turf has been successfully listed",
        variant: "success",
      });

      navigate("/client/dashboard");
    } catch (err: unknown) {
      let errorMessage = "Failed to add turf";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          console.error("Add turf error:", err.response.data);
          errorMessage =
            err.response.data?.error ||
            err.response.data?.message ||
            `Server error (${err.response.status})`;
        } else if (err.request) {
          errorMessage = "No response from server. Check your connection.";
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />

      <Navbar />

      <main className="pt-24 pb-12 relative z-10">
        <div className="container max-w-xl px-4">
          <Card variant="glass" className="glass-card border-white/10 shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Building2 className="w-5 h-5" />
                Add New Turf
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm text-muted-foreground">Turf Name</label>
                  <Input
                    name="name"
                    placeholder="Elite Sports Arena"
                    value={form.name}
                    onChange={handleChange}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Location</label>
                  <Input
                    name="location"
                    placeholder="Ahmedabad, Gujarat"
                    value={form.location}
                    onChange={handleChange}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Google Maps Link
                  </label>
                  <Input
                    name="google_maps_link"
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={form.google_maps_link}
                    onChange={handleChange}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the full Google Maps URL for your turf location
                  </p>

                  {/* Map Preview */}
                  {form.google_maps_link && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-white/10">
                      <div className="bg-secondary/50 px-3 py-2 flex items-center gap-2 border-b border-white/10">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Location Preview</span>
                      </div>
                      <div className="w-full h-[400px] bg-secondary/20">
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={
                            form.google_maps_link.includes('/maps/place/') || form.google_maps_link.includes('google.com/maps')
                              ? form.google_maps_link.replace('/view', '/embed')
                              : `https://maps.google.com/maps?q=${encodeURIComponent(form.google_maps_link)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                          }
                          title="Turf Location Map"
                        />
                      </div>
                      <div className="bg-secondary/50 px-3 py-2 text-xs text-muted-foreground border-t border-white/10">
                        This map will help users locate your turf easily
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <Textarea
                    name="description"
                    placeholder="Premium football turf with floodlights..."
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Price per Slot (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="price_per_slot"
                      type="number"
                      placeholder="1500"
                      value={form.price_per_slot}
                      onChange={handleChange}
                      className="pl-9 bg-secondary/30 border-white/10 focus:border-primary/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Facilities (comma separated)
                  </label>
                  <Input
                    name="facilities"
                    placeholder="Parking, Floodlights, Washroom"
                    value={form.facilities}
                    onChange={handleChange}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Turf Images
                  </label>

                  {/* File Upload */}
                  <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-secondary/20 hover:bg-secondary/30 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 10MB each, up to 10 images)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        disabled={uploadingImages || imageFiles.length >= 10}
                      />
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manual URL Input (Optional) */}
                  <div className="relative">
                    <Image className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="images"
                      placeholder="Or enter image URLs (comma separated, optional)"
                      value={form.images}
                      onChange={handleChange}
                      className="pl-9 bg-secondary/30 border-white/10 focus:border-primary/60"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can upload files above or enter URLs manually
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary shadow-glow"
                  disabled={loading || uploadingImages}
                >
                  {uploadingImages
                    ? "Uploading Images..."
                    : loading
                      ? "Creating Turf..."
                      : "Create Turf"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddTurfPage;
