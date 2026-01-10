/**
 * ============================================================================
 * ANALYTICS INTEGRATION EXAMPLE
 * ============================================================================
 * This file demonstrates how to integrate TurfAnalytics into your dashboard.
 * Copy the relevant sections to your ClientDashboard.tsx file.
 */

import React, { useState } from 'react';
import TurfAnalytics from '@/components/analytics/TurfAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BarChart3, Calendar } from 'lucide-react';

// ============================================================================
// STEP 1: Add these imports to your ClientDashboard.tsx
// ============================================================================
/*
import TurfAnalytics from '@/components/analytics/TurfAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
*/

// ============================================================================
// STEP 2: Add state management for analytics tab
// ============================================================================
/*
const [showAnalytics, setShowAnalytics] = useState(false);
*/

// ============================================================================
// STEP 3: Add Analytics tab button (example JSX)
// ============================================================================
const AnalyticsTabButton = ({
    showAnalytics,
    setShowAnalytics,
    setViewBookings
}: {
    showAnalytics: boolean;
    setShowAnalytics: (value: boolean) => void;
    setViewBookings?: (value: boolean) => void;
}) => {
    return (
        <Button
            variant={showAnalytics ? "default" : "ghost"}
            onClick={() => {
                setShowAnalytics(true);
                if (setViewBookings) setViewBookings(false);
            }}
            className="flex items-center gap-2"
        >
            <BarChart3 className="w-4 h-4" />
            Analytics
        </Button>
    );
};

// ============================================================================
// STEP 4: Add Analytics section (example usage)
// ============================================================================
interface AnalyticsSectionProps {
    showAnalytics: boolean;
    selectedTurf: { id: string; name: string } | null;
}

const AnalyticsSection = ({ showAnalytics, selectedTurf }: AnalyticsSectionProps) => {
    return (
        <>
            {showAnalytics && selectedTurf && (
                <div className="mt-6">
                    <TurfAnalytics
                        turfId={selectedTurf.id}
                        turfName={selectedTurf.name}
                    />
                </div>
            )}
        </>
    );
};

// ============================================================================
// ALTERNATIVE: Analytics as default section (no tabs)
// ============================================================================
const AnalyticsDefaultSection = ({ selectedTurf }: { selectedTurf: { id: string; name: string } | null }) => {
    return (
        <>
            {selectedTurf && (
                <div className="mt-8">
                    <TurfAnalytics
                        turfId={selectedTurf.id}
                        turfName={selectedTurf.name}
                    />
                </div>
            )}
        </>
    );
};

// ============================================================================
// COMPLETE EXAMPLE: Full Integration in ClientDashboard
// ============================================================================
interface Turf {
    id: string;
    name: string;
    location?: string;
    description?: string;
}

const ClientDashboardExample = () => {
    const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showBookings, setShowBookings] = useState(false);

    // Mock data - replace with actual data fetching
    const turfs: Turf[] = [
        {
            id: '1',
            name: 'Example Turf 1',
            location: 'Mumbai',
            description: 'Premium football turf'
        },
        {
            id: '2',
            name: 'Example Turf 2',
            location: 'Delhi',
            description: 'Cricket practice ground'
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container pt-24 pb-12 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">My Turfs</h1>
                    <p className="text-muted-foreground">
                        Manage your turfs and view analytics
                    </p>
                </div>

                {/* Turfs List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {turfs.map((turf) => (
                        <Card
                            key={turf.id}
                            onClick={() => setSelectedTurf(turf)}
                            className={`cursor-pointer transition-all hover:shadow-lg ${selectedTurf?.id === turf.id
                                ? 'border-primary shadow-md'
                                : 'hover:border-primary/50'
                                }`}
                        >
                            <CardHeader>
                                <CardTitle>{turf.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    📍 {turf.location}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {turf.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                {selectedTurf && (
                    <div className="space-y-4">
                        <div className="flex gap-2 border-b border-border pb-2">
                            <Button
                                variant={showAnalytics ? "default" : "ghost"}
                                onClick={() => {
                                    setShowAnalytics(true);
                                    setShowBookings(false);
                                }}
                                className="flex items-center gap-2"
                            >
                                <BarChart3 className="w-4 h-4" />
                                Analytics
                            </Button>
                            <Button
                                variant={showBookings ? "default" : "ghost"}
                                onClick={() => {
                                    setShowBookings(true);
                                    setShowAnalytics(false);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                Bookings
                            </Button>
                        </div>

                        {/* Analytics Section */}
                        {showAnalytics && (
                            <TurfAnalytics
                                turfId={selectedTurf.id}
                                turfName={selectedTurf.name}
                            />
                        )}

                        {/* Bookings Section */}
                        {showBookings && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bookings for {selectedTurf.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Your existing bookings component goes here
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

// ============================================================================
// EXPORT
// ============================================================================
export default ClientDashboardExample;

// Also export the modular components for reuse
export { AnalyticsTabButton, AnalyticsSection, AnalyticsDefaultSection };
