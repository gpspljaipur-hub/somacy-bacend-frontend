const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log("Running prisma generate...");
    const out = execSync('npx prisma generate', { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: 'D:\\Somacy\\Backend new\\somacy-bacend-frontend'
    });
    fs.writeFileSync('prisma_log.txt', "OUT: " + out);
} catch (e) {
    fs.writeFileSync('prisma_log.txt', "ERR: " + e.message + "\nOUT: " + (e.stdout || '') + "\nSTDERR: " + (e.stderr || ''));
}
