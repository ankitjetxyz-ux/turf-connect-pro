// Verification Script
// Native fetch (Node 18+)

async function verify() {
    console.log("Testing Backend connection...");
    try {
        const apiUrl = process.env.API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/ai/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Hello, are you there?" })
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text}`);

        if (response.ok) {
            console.log("✅ SUCCESS: Backend returned 200 OK");
            if (text.startsWith("{")) {
                console.log("⚠️ WARNING: Response looks like JSON, expected plain text!");
            } else {
                console.log("✅ SUCCESS: Response is plain text.");
            }
        } else {
            console.log("❌ FAILED: Backend returned error status");
        }

    } catch (error) {
        console.error("❌ ERROR: Connection failed", error);
    }
}

verify();
