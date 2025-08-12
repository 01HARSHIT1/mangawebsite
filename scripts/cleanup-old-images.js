// Cleanup script: delete .jpg/.jpeg/.png images in public/uploads/ if .webp exists
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

function getWebpName(file) {
    return file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}

function main() {
    const files = fs.readdirSync(UPLOADS_DIR);
    let deleted = 0;
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            const webpName = getWebpName(file);
            if (files.includes(webpName)) {
                fs.unlinkSync(path.join(UPLOADS_DIR, file));
                console.log(`Deleted: ${file}`);
                deleted++;
            }
        }
    }
    console.log(`Cleanup complete. Deleted ${deleted} files.`);
}

main(); 