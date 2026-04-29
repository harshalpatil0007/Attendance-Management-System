const { execSync } = require('child_process');

console.log("🔄 Starting Git Auto-Sync...");
console.log("Every 30 seconds, any saved changes will be automatically committed and pushed to GitHub.");
console.log("Press Ctrl+C to stop.");

setInterval(() => {
    try {
        // Check if there are any changes
        const status = execSync('git status --porcelain').toString();
        
        if (status.trim() !== '') {
            const date = new Date().toLocaleString();
            console.log(`\n📝 Changes detected! Committing and pushing at ${date}...`);
            
            execSync('git add .');
            execSync(`git commit -m "Auto sync: ${date}"`);
            execSync('git push origin main');
            
            console.log("✅ Push successful!");
        }
    } catch (e) {
        // Ignore errors if there's nothing to commit or if push fails temporarily
        if (!e.message.includes("nothing to commit")) {
            console.error("⚠️ Error during auto-sync:", e.message);
        }
    }
}, 30000); // 30000 milliseconds = 30 seconds
