import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Trophy } from "lucide-react";

const AddTournamentPage = () => {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 grid-overlay opacity-20" />
            <Navbar />

            <main className="pt-24 pb-12 relative z-10 container px-4 flex flex-col items-center justify-center min-h-[60vh] flex-1">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 max-w-lg mx-auto">
                    <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
                        <Trophy className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold font-heading">Tournament Organization Coming Soon</h2>
                    <p className="text-muted-foreground">
                        We are building powerful tools for you to organize and manage tournaments seamlessly.
                        Stay tuned for the launch!
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AddTournamentPage;
