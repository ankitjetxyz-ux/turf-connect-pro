import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Check, X, ArrowLeft, MapPin, User, Phone, Mail, Calendar, FileText, Image as ImageIcon, ExternalLink, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types
interface VerificationDocument {
    id: string;
    document_type: string;
    document_url: string;
    status: 'pending' | 'approved' | 'rejected';
    uploaded_at: string;
}

interface TurfDetail {
    id: string;
    name: string;
    location: string;
    formatted_address: string;
    description: string;
    price_per_slot: number;
    facilities: string;
    images: string[];
    verification_status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    google_maps_link?: string;
    owner: {
        name: string;
        email: string;
        phone: string;
        email_verified: boolean;
    };
    turf_verification_documents?: VerificationDocument[];
}

const TurfVerificationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [rejectReason, setRejectReason] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Fetch Turf Details
    const fetchTurfDetails = async () => {
        const response = await api.get(`/admin/turfs/${id}`);
        return response.data.turf as TurfDetail;
    };

    const { data: turf, isLoading, error } = useQuery({
        queryKey: ['admin-turf-detail', id],
        queryFn: fetchTurfDetails,
    });

    // Approve Mutation
    const approveMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post(`/admin/turfs/${id}/approve`, { adminNotes });
            return response.data;
        },
        onSuccess: () => {
            toast({ title: "Turf Approved", description: "The turf is now live on the platform." });
            navigate("/admin/verification");
        },
        onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to approve turf." });
        }
    });

    // Reject Mutation
    const rejectMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post(`/admin/turfs/${id}/reject`, {
                rejectionReason: rejectReason,
                adminNotes
            });
            return response.data;
        },
        onSuccess: () => {
            toast({ title: "Turf Rejected", description: "The owner has been notified." });
            navigate("/admin/verification");
        },
        onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to reject turf." });
        }
    });

    if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading turf details...</div>;
    if (error || !turf) return <div className="p-12 text-center text-red-500">Error loading turf details.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground hover:text-foreground">
                            <Link to="/admin/verification">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <Badge variant="outline" className="text-muted-foreground">
                            ID: {turf.id.slice(0, 8)}
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{turf.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {turf.location}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {turf.verification_status === 'pending' && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => setIsRejectDialogOpen(true)}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setIsApproveDialogOpen(true)}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Approve & Publish
                            </Button>
                        </>
                    )}
                    {turf.verification_status !== 'pending' && (
                        <Badge className="text-base px-4 py-1" variant="secondary">
                            Status: {turf.verification_status.toUpperCase()}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Owner & Quick Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Owner Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground uppercase font-semibold">Name</label>
                                <div className="font-medium">{turf.owner?.name}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground uppercase font-semibold">Contact</label>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {turf.owner?.email}
                                    {turf.owner?.email_verified && <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">Verified</Badge>}
                                </div>
                                {turf.owner?.phone && (
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        {turf.owner?.phone}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground uppercase font-semibold">Submission Date</label>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {new Date(turf.submitted_at).toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Internal Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Add internal verification notes here..."
                                className="min-h-[100px] resize-none"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                These notes are only visible to admins.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Turf Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Turf Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Price Per Slot</label>
                                    <div className="text-lg font-semibold">₹ {turf.price_per_slot}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                                    <div className="text-base">{turf.formatted_address || turf.location}</div>
                                    {turf.google_maps_link && (
                                        <a href={turf.google_maps_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                            View on Google Maps
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <div className="text-sm leading-relaxed whitespace-pre-line p-3 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-md">
                                    {turf.description || "No description provided."}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Facilities</label>
                                <div className="flex flex-wrap gap-2">
                                    {turf.facilities?.split(',').map((facility, i) => (
                                        <Badge key={i} variant="secondary">{facility.trim()}</Badge>
                                    )) || <span className="text-sm text-muted-foreground">No facilities listed</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Images ({turf.images?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(!turf.images || turf.images.length === 0) ? (
                                <div className="text-sm text-muted-foreground text-center py-6">No images uploaded.</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {turf.images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="aspect-square relative rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setSelectedImage(img)}
                                        >
                                            <img src={img} alt={`Turf ${idx}`} className="object-cover w-full h-full" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents Section - Updated */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                Verification Documents ({turf.turf_verification_documents?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(!turf.turf_verification_documents || turf.turf_verification_documents.length === 0) ? (
                                <div className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-md text-center">
                                    No documents submitted.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {turf.turf_verification_documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm capitalize">{doc.document_type.replace(/_/g, " ")}</div>
                                                    <div className="text-xs text-muted-foreground">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                    View
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircleIcon className="h-5 w-5" />
                            Reject Turf Submission
                        </DialogTitle>
                        <DialogDescription>
                            This action will notify the owner that their submission needs changes. Please provide a clear reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rejection Reason (Required)</label>
                            <Textarea
                                placeholder="e.g., Images are blurry, Location does not match description..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectMutation.mutate()}
                            disabled={!rejectReason.trim() || rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Turf</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this turf? It will become visible to all users on the platform immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate()}
                            disabled={approveMutation.isPending}
                        >
                            {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="Full size"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-md"
                    />
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                        <X className="h-8 w-8" />
                    </button>
                </div>
            )}
        </div>
    );
};

// Helper icon
const AlertCircleIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

export default TurfVerificationDetail;
