import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Eye, Filter, Loader2 } from "lucide-react";

// Types
interface Turf {
    id: string;
    name: string;
    location: string;
    formatted_address: string;
    verification_status: 'pending' | 'approved' | 'rejected' | 'under_review';
    submitted_at: string;
    owner: {
        name: string;
        email: string;
    };
}

const VerificationPanel = () => {
    const [activeTab, setActiveTab] = useState("pending");
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();

    const fetchTurfs = async (status: string) => {
        const response = await api.get(`/admin/turfs/status/${status}?search=${searchTerm}`);
        return response.data.turfs as Turf[];
    };

    const { data: turfs, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-turfs', activeTab, searchTerm],
        queryFn: () => fetchTurfs(activeTab),
    });

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            refetch();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm, refetch]);

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
        };
        return (
            <Badge className={`${styles[status as keyof typeof styles] || "bg-gray-100"} border-0`}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Turf Verification</h1>
                    <p className="text-muted-foreground">Review and manage turf listing requests.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex md:items-center justify-between flex-col md:flex-row gap-4">
                        <CardTitle>Turfs List</CardTitle>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search turfs or owners..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-0">
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : error ? (
                                <div className="p-8 text-center text-red-500">
                                    Failed to load turfs. Please try again.
                                </div>
                            ) : turfs?.length === 0 ? (
                                <div className="p-16 text-center text-muted-foreground">
                                    No {activeTab} turfs found.
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Turf Name</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Owner</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {turfs?.map((turf) => (
                                                <TableRow key={turf.id}>
                                                    <TableCell className="font-medium">{turf.name}</TableCell>
                                                    <TableCell>{turf.location || turf.formatted_address?.split(',')[0]}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{turf.owner?.name}</span>
                                                            <span className="text-xs text-muted-foreground">{turf.owner?.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{new Date(turf.submitted_at).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={turf.verification_status} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link to={`/manage/verification/${turf.id}`}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Review
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default VerificationPanel;
