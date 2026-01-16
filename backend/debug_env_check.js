
require("dotenv").config();
const fs = require('fs');
const path = require('path');

console.log("Current directory:", process.cwd());
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
    console.log(".env file found at:", envPath);
    const content = fs.readFileSync(envPath, 'utf8');
    console.log("File content length:", content.length);
    console.log("First 20 chars:", content.substring(0, 20).replace(/\n/g, '\\n'));
    
    // Check if lines look valid
    const lines = content.split('\n');
    console.log("Total lines:", lines.length);
    lines.forEach((line, i) => {
        if (line.trim()) {
            if (line.includes('=')) {
                const parts = line.split('=');
                console.log(`Line ${i+1}: Key='${parts[0].trim()}' ValueLength=${parts[1].trim().length}`);
            } else {
                console.log(`Line ${i+1}: No '=' found (Invalid format?) -> ${line.substring(0, 10)}...`);
            }
        }
    });

} else {
    console.log(".env file NOT found!");
}

console.log("\nLoaded process.env keys:");
['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'].forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'Set' : 'MISSING'}`);
});
