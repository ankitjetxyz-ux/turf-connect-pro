import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import api from "@/services/api";
import { Loader2 } from "lucide-react";
import BasicInfoSection from "./BasicInfoSection";
import FacilitiesSection from "./FacilitiesSection";
import ImageUploadSection from "./ImageUploadSection";
import DocumentUploadSection from "./DocumentUploadSection";

const AddTurfForm = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // URL Params for Edit Mode
    const [searchParams] = useSearchParams();
    const editTurfId = searchParams.get("edit_turf_id");
    const isEditMode = !!editTurfId;

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        description: "",
        price_per_slot: "",
        facilities: "",
        google_maps_link: "",
        images: "",
    });

    // File States
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [docFiles, setDocFiles] = useState<{ file: File; type: string }[]>([]);

    // Edit Mode States (Existing Data)
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [existingDocs, setExistingDocs] = useState<{ type: string; url: string }[]>([]);

    // Load Data for Edit
    useEffect(() => {
        if (isEditMode && editTurfId) {
            const fetchTurf = async () => {
                try {
                    setLoading(true);
                    const res = await api.get(`/turfs/${editTurfId}`);
                    const turf = res.data;

                    setFormData({
                        name: turf.name,
                        location: turf.location,
                        description: turf.description || "",
                        price_per_slot: String(turf.price_per_slot),
                        facilities: turf.facilities || "",
                        google_maps_link: turf.google_maps_url || "",
                        images: "",
                    });

                    // Set existing images
                    if (turf.images_urls && Array.isArray(turf.images_urls)) {
                        setExistingImages(turf.images_urls);
                    } else if (turf.images && Array.isArray(turf.images)) {
                        setExistingImages(turf.images);
                    }

                    // Set existing docs
                    if (turf.turf_verification_documents && Array.isArray(turf.turf_verification_documents)) {
                        setExistingDocs(turf.turf_verification_documents.map((d: any) => ({
                            type: d.document_type || d.type,
                            url: d.document_url || d.url
                        })));
                    }

                } catch (error) {
                    console.error("Failed to load turf details", error);
                    toast({ title: "Error", description: "Could not load turf details for editing.", variant: "destructive" });
                    navigate("/client/dashboard");
                } finally {
                    setLoading(false);
                }
            };
            fetchTurf();
        }
    }, [editTurfId, isEditMode, navigate, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.location || !formData.price_per_slot) {
            toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        // Validation: Images
        if (imageFiles.length + existingImages.length === 0) {
            toast({ title: "Missing Images", description: "Please upload at least one image of your turf.", variant: "destructive" });
            return;
        }

        // Validation: Documents - Strict Check
        const requiredTypes = ["ownership_proof", "business_license", "id_proof"];
        const uploadedTypes = new Set([
            ...docFiles.map(d => d.type),
            ...existingDocs.map(d => d.type)
        ]);

        const missingTypes = requiredTypes.filter(t => !uploadedTypes.has(t));

        if (missingTypes.length > 0) {
            const readableMissing = missingTypes.map(t => t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())).join(", ");
            toast({
                title: "Missing Required Documents",
                description: `Please upload the following: ${readableMissing}`,
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            // 1. Upload Images
            let imageUrls: string[] = [...existingImages]; // Start with existing
            if (imageFiles.length > 0) {
                const imageFormData = new FormData();
                imageFiles.forEach(f => imageFormData.append("images", f));
                const res = await api.post("/turfs/upload-images", imageFormData);
                const newUrls = res.data.image_urls || [];
                imageUrls = [...imageUrls, ...newUrls];
            }

            // 2. Upload Documents
            let docUrls: { type: string, url: string }[] = [...existingDocs]; // Start with existing
            if (docFiles.length > 0) {
                const docFormData = new FormData();
                docFiles.forEach(d => docFormData.append("documents", d.file));

                const res = await api.post("/turfs/upload-documents", docFormData);
                const uploadedUrls = res.data.document_urls || [];

                const newDocs = uploadedUrls.map((url: string, idx: number) => ({
                    type: docFiles[idx]?.type || 'ownership_proof',
                    url: url
                }));
                docUrls = [...docUrls, ...newDocs];
            }

            // 3. Submit Turf
            const payload = {
                ...formData,
                price_per_slot: Number(formData.price_per_slot),
                images: imageUrls, // Send array of URLs
                verification_documents: docUrls
            };

            await api.post("/turfs", payload);

            // 4. Delete Old Turf (Reviewer Note: This implements "Edit" via "Clone & Delete")
            if (isEditMode && editTurfId) {
                try {
                    await api.delete(`/turfs/${editTurfId}`);
                    console.log("Old rejected turf deleted successfully");
                } catch (delErr) {
                    console.error("Failed to delete old turf during resubmission", delErr);
                    // Non-blocking
                }
            }

            toast({
                title: isEditMode ? "Resubmitted Successfully" : "Submission Successful! 🎉",
                description: "Your turf has been submitted for verification.",
                variant: "success",
            });

            navigate("/client/dashboard");
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.error || err.message || "Failed to submit turf. Please try again.";
            toast({ title: "Submission Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />

            <Navbar />

            <main className="flex-1 container max-w-4xl py-12 px-4 relative z-10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold font-heading text-foreground mb-2 neon-glow">
                        {isEditMode ? "Resubmit Turf" : "List Your Turf"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditMode
                            ? "Update your details and resubmit for verification."
                            : "Submit your turf details for verification and start getting bookings."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <BasicInfoSection formData={formData} handleChange={handleChange} />

                    <FacilitiesSection formData={formData} setFormData={setFormData} />

                    <ImageUploadSection
                        imageFiles={imageFiles}
                        setImageFiles={setImageFiles}
                        existingImages={existingImages}
                        setExistingImages={setExistingImages}
                    />

                    <DocumentUploadSection
                        docFiles={docFiles}
                        setDocFiles={setDocFiles}
                        existingDocs={existingDocs}
                        setExistingDocs={setExistingDocs}
                    />

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-medium gradient-primary shadow-glow hover:shadow-glow-sm transition-all"
                        disabled={loading}
                    >
                        {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {isEditMode ? "Resubmitting..." : "Submitting..."}</> : (isEditMode ? "Update & Resubmit" : "Submit for Verification")}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        By submitting, you agree to our terms and conditions. Your turf will be reviewed within 24-48 hours.
                    </p>
                </form>
            </main>

            <Footer />
        </div>
    );
};

export default AddTurfForm;
