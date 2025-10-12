const fs = require('fs');
const path = require('path');

console.log('🔍 Finding Server Pages Without force-dynamic\n');
console.log('='.repeat(60));

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

const pageFiles = findFiles('./src/app', 'page.tsx');
const missingDynamic = [];

console.log(`\nFound ${pageFiles.length} page.tsx files\n`);

pageFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if it's a server component (has async function)
    const hasAsyncFunction = /export\s+(default\s+)?async\s+function/.test(content);
    const hasClientDirective = /['"]use client['"]/.test(content);
    const hasDynamic = /export\s+const\s+dynamic\s*=/.test(content);
    
    if (hasAsyncFunction && !hasClientDirective && !hasDynamic) {
        missingDynamic.push({
            file: file.replace(/\\/g, '/'),
            reason: 'Server component without force-dynamic'
        });
        console.log(`❌ ${file.replace(/\\/g, '/')}`);
        console.log(`   Server component missing: export const dynamic = 'force-dynamic'`);
    }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 SUMMARY: ${missingDynamic.length} pages need force-dynamic`);

if (missingDynamic.length > 0) {
    console.log('\n🔧 FILES TO FIX:');
    missingDynamic.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.file}`);
    });
}

fs.writeFileSync('missing-dynamic.json', JSON.stringify(missingDynamic, null, 2));
console.log('\n✅ Report saved to: missing-dynamic.json');
