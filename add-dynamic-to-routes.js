const fs = require('fs');
const path = require('path');

console.log('🔧 Adding force-dynamic to all API routes\n');

function findFiles(dir, pattern) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(findFiles(filePath, pattern));
            }
        } else if (file === pattern) {
            results.push(filePath);
        }
    });
    
    return results;
}

const routeFiles = findFiles('./src/app/api', 'route.ts');
let fixed = 0;
let skipped = 0;

console.log(`Found ${routeFiles.length} route.ts files\n`);

routeFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if already has dynamic export
    if (content.includes('export const dynamic')) {
        console.log(`✅ ${file.replace(/\\/g, '/')} - Already has dynamic`);
        skipped++;
        return;
    }
    
    // Find the first import statement
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find last import line
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
            insertIndex = i + 1;
        } else if (lines[i].trim() && !lines[i].trim().startsWith('import ') && insertIndex > 0) {
            break;
        }
    }
    
    // Insert dynamic exports after imports
    const dynamicExports = "\nexport const dynamic = 'force-dynamic';\nexport const runtime = 'nodejs';\n";
    lines.splice(insertIndex, 0, dynamicExports);
    
    const newContent = lines.join('\n');
    fs.writeFileSync(file, newContent);
    
    console.log(`✅ ${file.replace(/\\/g, '/')} - Added dynamic export`);
    fixed++;
});

console.log('\n' + '='.repeat(60));
console.log(`📊 SUMMARY:`);
console.log(`  ✅ Fixed: ${fixed} files`);
console.log(`  ⏭️  Skipped: ${skipped} files (already had dynamic)`);
console.log(`  📝 Total: ${routeFiles.length} files`);
