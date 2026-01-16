import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell } from "lucide-react";

interface FacilitiesSectionProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const COMMON_FACILITIES = [
    "Parking",
    "Floodlights",
    "Changing Room",
    "Washroom",
    "Drinking Water",
    "First Aid",
    "Cafeteria",
    "WiFi",
    "Equipment Rental",
    "Showers",
    "Seating Area",
    "CCTV Surveillance",
];

const FacilitiesSection: React.FC<FacilitiesSectionProps> = ({ formData, setFormData }) => {
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    const [additionalFacilities, setAdditionalFacilities] = useState<string>("");

    // Initialize from parent only on mount (parse the string)
    // Note: This assumes one-way partial sync to avoid loop if parent updates from this component
    useEffect(() => {
        if (formData.facilities) {
            const parts = formData.facilities.split(",").map((s: string) => s.trim()).filter(Boolean);
            const common = parts.filter((p: string) => COMMON_FACILITIES.includes(p));
            const others = parts.filter((p: string) => !COMMON_FACILITIES.includes(p));

            // Only set if different to specific initial load to avoid overwrite loops if we were editing local state
            // Actually simpler: Just rely on local state and push to parent. 
            // But if we want to support "Edit Mode" later, we need to parse.
            // For now, let's just push local -> parent.
        }
    }, []);

    const updateParent = (selected: string[], additional: string) => {
        const additionalParts = additional.split(",").map(s => s.trim()).filter(Boolean);
        const allFacilities = [...selected, ...additionalParts].join(", ");
        setFormData((prev: any) => ({ ...prev, facilities: allFacilities }));
    };

    const handleCheckboxChange = (facility: string, checked: boolean) => {
        let newSelected;
        if (checked) {
            newSelected = [...selectedFacilities, facility];
        } else {
            newSelected = selectedFacilities.filter((f) => f !== facility);
        }
        setSelectedFacilities(newSelected);
        updateParent(newSelected, additionalFacilities);
    };

    const handleAdditionalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setAdditionalFacilities(val);
        updateParent(selectedFacilities, val);
    };

    return (
        <Card className="glass-card border-white/10 shadow-glow hover:shadow-glow-sm transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary neon-glow">
                    <Dumbbell className="w-5 h-5" />
                    Facilities & Amenities
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    Select all available facilities to help users find your turf.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Checkboxes Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {COMMON_FACILITIES.map((facility) => (
                        <div key={facility} className="flex items-center space-x-2">
                            <Checkbox
                                id={`facility-${facility}`}
                                checked={selectedFacilities.includes(facility)}
                                onCheckedChange={(checked) => handleCheckboxChange(facility, checked as boolean)}
                                className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                            />
                            <Label
                                htmlFor={`facility-${facility}`}
                                className="text-sm font-normal cursor-pointer text-foreground/90 hover:text-primary transition-colors"
                            >
                                {facility}
                            </Label>
                        </div>
                    ))}
                </div>

                {/* Additional Facilities */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                    <Label htmlFor="additional-facilities" className="text-foreground/80">Additional Facilities</Label>
                    <Textarea
                        id="additional-facilities"
                        placeholder="e.g. Referee service, Ball rental, Coaching (comma separated)"
                        value={additionalFacilities}
                        onChange={handleAdditionalChange}
                        className="bg-secondary/30 border-white/10 focus:border-primary/60 focus:ring-primary/20 min-h-[80px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        Enter any other amenities not listed above.
                    </p>
                </div>

            </CardContent>
        </Card>
    );
};

export default FacilitiesSection;
