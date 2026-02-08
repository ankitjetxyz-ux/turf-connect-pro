import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background Elements */}
            <div className="absolute inset-0 grid-overlay-intense" />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-primary/5 rounded-full blur-[120px]" />

            <Navbar />

            <main className="pt-24 pb-16 relative z-10 flex-1">
                <div className="container px-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8 text-gradient">Terms and Conditions</h1>

                    <div className="space-y-6 text-muted-foreground">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">1. Agreement to Terms</h2>
                            <p>
                                These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and TurfBook ("we," "us" or "our"), concerning your access to and use of the TurfBook website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">2. User Representations</h2>
                            <p>
                                By using the Site, you represent and warrant that:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>All registration information you submit will be true, accurate, current, and complete.</li>
                                <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                                <li>You have the legal capacity and you agree to comply with these Terms and Conditions.</li>
                                <li>You are not a minor in the jurisdiction in which you reside.</li>
                                <li>You will not use the Site for any illegal or unauthorized purpose.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">3. Booking and Payments</h2>
                            <p>
                                All bookings made through the Site are subject to acceptance by the Turf Owner. We are not responsible for any cancellations by the Turf Owner. Payments may be processed through third-party payment providers, and you agree to their terms and conditions.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">4. Cancellation and Refunds</h2>
                            <p>
                                Cancellation policies are set by individual Turf Owners or by platform defaults. Refunds, if applicable, will be processed according to the specific policy in effect at the time of booking.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">5. Prohibited Activities</h2>
                            <p>
                                You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">6. Contact Us</h2>
                            <p>
                                In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: support@turfbook.com
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TermsPage;
