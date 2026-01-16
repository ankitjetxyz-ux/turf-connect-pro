import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileCheck, Upload, X, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DocumentUploadSectionProps {
    docFiles: { file: File; type: string }[];
    setDocFiles: React.Dispatch<React.SetStateAction<{ file: File; type: string }[]>>;
    existingDocs?: { type: string; url: string }[];
    setExistingDocs?: React.Dispatch<React.SetStateAction<{ type: string; url: string }[]>>;
}

const ALL_DOC_TYPES = [
    { value: "ownership_proof", label: "Property Ownership Proof" },
    { value: "business_license", label: "Business License / Gumasta" },
    { value: "id_proof", label: "Owner ID Proof (Aadhaar/PAN)" },
    { value: "other", label: "Other Supporting Document" }
];

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({ docFiles, setDocFiles, existingDocs = [], setExistingDocs }) => {
    const [selectedType, setSelectedType] = useState<string>("");

    // Calculate used types
    const usedTypes = new Set([
        ...docFiles.map(d => d.type),
        ...existingDocs.map(d => d.type)
    ]);

    // Derived available types
    const availableTypes = ALL_DOC_TYPES.filter(t => !usedTypes.has(t.value));

    // Auto-select first available type if current selection is invalid or empty
    useEffect(() => {
        if (availableTypes.length > 0) {
            // If nothing selected, or selected is now used, switch to first available
            if (!selectedType || usedTypes.has(selectedType)) {
                setSelectedType(availableTypes[0].value);
            }
        } else {
            setSelectedType(""); // No options left
        }
    }, [docFiles, existingDocs, usedTypes, selectedType]); // Check dependencies carefully

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Only take the first file if multiple selected (to enforce type selection per file)
        const file = files[0];

        // Validate
        const isValidType = ["image/jpeg", "image/png", "application/pdf"].includes(file.type);
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

        if (!isValidType) {
            toast({ title: "Invalid File", description: "Only PDF, JPG, PNG allowed", variant: "destructive" });
            return;
        }
        if (!isValidSize) {
            toast({ title: "File too large", description: "Max 10MB allowed", variant: "destructive" });
            return;
        }

        // Check duplicate type (New Files + Existing Docs)
        const isDuplicate =
            docFiles.some(d => d.type === selectedType) ||
            existingDocs.some(d => d.type === selectedType);

        if (isDuplicate) {
            toast({
                title: "Duplicate Document Type",
                description: "You have already uploaded a document of this type.",
                variant: "destructive"
            });
            return;
        }

        setDocFiles(prev => [...prev, { file, type: selectedType }]);
    };

    const removeDoc = (index: number) => {
        if (index < existingDocs.length) {
            setExistingDocs?.(prev => prev.filter((_, i) => i !== index));
        } else {
            const fileIndex = index - existingDocs.length;
            setDocFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
    };

    const allDocs = [
        ...existingDocs.map(d => ({
            name: "Existing Document",
            type: d.type,
            url: d.url,
            isExisting: true
        })),
        ...docFiles.map(d => ({
            name: d.file.name,
            type: d.type,
            url: null,
            isExisting: false
        }))
    ];

    return (
        <Card className="glass-card border-white/10 shadow-glow hover:shadow-glow-sm transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary neon-glow">
                    <FileCheck className="w-5 h-5" />
                    Verification Documents
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    Upload documents to verify your turf ownership.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Upload Control */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3 space-y-2">
                        <Label>Document Type</Label>
                        <Select
                            value={selectedType}
                            onValueChange={setSelectedType}
                            disabled={availableTypes.length === 0}
                        >
                            <SelectTrigger className="bg-secondary/30 border-white/10">
                                <SelectValue placeholder={availableTypes.length === 0 ? "All types uploaded" : "Select Type"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-2/3">
                        <Label className="mb-2 block">Upload File</Label>
                        <div className="relative">
                            <input
                                type="file"
                                id="doc-upload"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                disabled={availableTypes.length === 0 || !selectedType}
                            />
                            <label
                                htmlFor="doc-upload"
                                className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-md bg-secondary/50 border border-white/10 hover:bg-secondary/80 cursor-pointer transition-colors text-sm font-medium"
                            >
                                <Upload className="w-4 h-4" />
                                Choose File
                            </label>
                        </div>
                    </div>
                </div>

                {/* File List */}
                {allDocs.length > 0 && (
                    <div className="space-y-2 animate-fade-in">
                        <Label>Attached Documents</Label>
                        <div className="grid gap-3">
                            {allDocs.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-white/10">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate">
                                                {doc.isExisting ? (
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                                        {doc.type} (View)
                                                    </a>
                                                ) : doc.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground capitalize">{doc.type?.replace(/_/g, ' ')}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeDoc(index)}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {allDocs.length === 0 && (
                    <div className="text-center p-6 border border-dashed border-white/10 rounded-lg text-muted-foreground text-sm">
                        No documents attached yet. Please upload at least one proof of ownership.
                    </div>
                )}

            </CardContent>
        </Card>
    );
};

export default DocumentUploadSection;
