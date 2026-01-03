import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Turf } from "@/types";

interface TournamentFormData {
    name: string;
    sport: string;
    start_date: string;
    end_date: string;
    entry_fee: string;
    max_teams: string;
    turf_id: string;
    description: string;
    [key: string]: string;
}

const AddTournamentPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedTurfId = searchParams.get("turf_id");
    const editId = searchParams.get("id");
    const { toast } = useToast();

    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // For file upload
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState<TournamentFormData>({
        name: "",
        sport: "Cricket",
        start_date: "",
        end_date: "",
        entry_fee: "",
        max_teams: "",
        turf_id: preSelectedTurfId || "",
        description: "",
    });

    useEffect(() => {
        // Fetch owned turfs to selecting location
        api.get("/turfs/my").then(res => setTurfs(res.data)).catch(console.error);

        // If editing, fetch tournament details
        if (editId) {
            setFetching(true);
            api.get(`/tournaments/${editId}`)
                .then(res => {
                    const t = res.data;
                    setFormData({
                        name: t.name || "",
                        sport: t.sport || "Cricket",
                        start_date: t.start_date || "",
                        end_date: t.end_date || "",
                        entry_fee: t.entry_fee || "",
                        max_teams: t.max_teams || "",
                        turf_id: t.turf_id || "",
                        description: t.description || "",
                    });
                    if (t.image) {
                        setPreviewUrl(t.image);
                    }
                })
                .catch(() => {
                    toast({ variant: "destructive", title: "Error", description: "Failed to load tournament" });
                    navigate("/client/dashboard");
                })
                .finally(() => setFetching(false));
        }
    }, [editId, navigate, toast]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        if (selectedImage) {
            data.append("image", selectedImage);
        }

        try {
            if (editId) {
                await api.put(`/tournaments/${editId}`, data, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({ title: "Success", description: "Tournament updated successfully!" });
            } else {
                await api.post("/tournaments", data, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({ title: "Success", description: "Tournament created successfully!" });
            }
            navigate("/client/dashboard");
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Operation failed";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="text-center pt-24">Loading...</div>;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 grid-overlay opacity-20" />
            <Navbar />

            <main className="pt-24 pb-12 relative z-10 container px-4">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6 font-heading">
                        {editId ? "Edit Tournament" : "Organize Tournament"}
                    </h1>

                    <Card className="glass-card border-white/10">
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">

                                <div className="space-y-2">
                                    <Label>Tournament Name</Label>
                                    <Input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Summer Cup 2025" className="bg-secondary/20" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Sport</Label>
                                        <Select value={formData.sport} onValueChange={(val) => handleSelectChange("sport", val)}>
                                            <SelectTrigger className="bg-secondary/20"><SelectValue placeholder="Select Sport" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cricket">Cricket</SelectItem>
                                                <SelectItem value="Football">Football</SelectItem>
                                                <SelectItem value="Badminton">Badminton</SelectItem>
                                                <SelectItem value="Tennis">Tennis</SelectItem>
                                                <SelectItem value="Basketball">Basketball</SelectItem>
                                                <SelectItem value="Hockey">Hockey</SelectItem>
                                                <SelectItem value="Kabaddi">Kabaddi</SelectItem>
                                                <SelectItem value="Volleyball">Volleyball</SelectItem>
                                                <SelectItem value="Running">Running</SelectItem>
                                                <SelectItem value="Golf">Golf</SelectItem>
                                                <SelectItem value="Table Tennis">Table Tennis</SelectItem>
                                                <SelectItem value="Rugby">Rugby</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Select Turf Venue</Label>
                                        <Select value={formData.turf_id} onValueChange={(val) => handleSelectChange("turf_id", val)}>
                                            <SelectTrigger className="bg-secondary/20"><SelectValue placeholder="Choose your turf" /></SelectTrigger>
                                            <SelectContent>
                                                {turfs.map(t => (
                                                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className="bg-secondary/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required className="bg-secondary/20" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Entry Fee (₹)</Label>
                                        <Input type="number" name="entry_fee" value={formData.entry_fee} onChange={handleChange} required className="bg-secondary/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Teams</Label>
                                        <Input type="number" name="max_teams" value={formData.max_teams} onChange={handleChange} required className="bg-secondary/20" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} className="bg-secondary/20" placeholder="Rules, prizes, etc." />
                                </div>

                                <div className="space-y-2">
                                    <Label>Banner Image</Label>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="bg-secondary/20 file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-3 file:text-sm file:font-medium hover:file:bg-primary/90"
                                        />
                                        {previewUrl && (
                                            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/10">
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                                    {loading
                                        ? (editId ? "Updating..." : "Created...")
                                        : (editId ? "Update Tournament" : "Create Tournament")}
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

export default AddTournamentPage;
