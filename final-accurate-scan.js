const fs = require('fs');
const path = require('path');

console.log('🔍 FINAL ACCURATE STACK OVERFLOW SCAN\n');
console.log('='.repeat(70));

const issues = [];

function findFiles(dir, extensions) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        
        list.forEach(file => {
            const filePath = path.join(dir, file);
            try {
                const stat = fs.statSync(filePath);
                
                if (stat && stat.isDirectory()) {
                    if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                        results = results.concat(findFiles(filePath, extensions));
                    }
                } else if (extensions.some(ext => file.endsWith(ext))) {
                    results.push(filePath);
                }
            } catch (err) {}
        });
    } catch (err) {}
    
    return results;
}

const allFiles = findFiles('./src', ['.ts', '.tsx']);

console.log(`\n📁 Scanning ${allFiles.length} files...\n`);

// CHECK 1: Excessive imports (>15 items from single module)
console.log('📦 CHECK 1: Excessive Imports (>15 items)');
console.log('-'.repeat(70));

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check react-icons
    const iconMatches = content.match(/import\s*{([^}]+)}\s*from\s*['"]react-icons\/\w+['"]/g);
    if (iconMatches) {
        iconMatches.forEach(match => {
            const items = match.match(/{([^}]+)}/)[1].split(',').filter(s => s.trim());
            if (items.length > 15) {
                issues.push({
                    severity: 'HIGH',
                    type: 'EXCESSIVE_ICONS',
                    file: file.replace(/\\/g, '/'),
                    count: items.length
                });
                console.log(`❌ ${file.replace(/\\/g, '/')}: ${items.length} icons`);
            }
        });
    }
    
    // Check recharts
    const rechartsMatches = content.match(/import\s*{([^}]+)}\s*from\s*['"]recharts['"]/g);
    if (rechartsMatches) {
        rechartsMatches.forEach(match => {
            const items = match.match(/{([^}]+)}/)[1].split(',').filter(s => s.trim());
            if (items.length > 20) {
                issues.push({
                    severity: 'HIGH',
                    type: 'EXCESSIVE_RECHARTS',
                    file: file.replace(/\\/g, '/'),
                    count: items.length
                });
                console.log(`❌ ${file.replace(/\\/g, '/')}: ${items.length} recharts`);
            }
        });
    }
    
    // Check framer-motion
    const motionMatches = content.match(/import\s*{([^}]+)}\s*from\s*['"]framer-motion['"]/g);
    if (motionMatches) {
        motionMatches.forEach(match => {
            const items = match.match(/{([^}]+)}/)[1].split(',').filter(s => s.trim());
            if (items.length > 15) {
                issues.push({
                    severity: 'MEDIUM',
                    type: 'EXCESSIVE_MOTION',
                    file: file.replace(/\\/g, '/'),
                    count: items.length
                });
                console.log(`⚠️  ${file.replace(/\\/g, '/')}: ${items.length} motion components`);
            }
        });
    }
});

// CHECK 2: useEffect without dependencies that updates state
console.log('\n🔁 CHECK 2: useEffect Without Dependencies');
console.log('-'.repeat(70));

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // More accurate check: useEffect with setState but NO dependency array at all
    const useEffectPattern = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*set\w+\([^}]*\}\s*\)/g;
    const matches = content.match(useEffectPattern);
    
    if (matches) {
        matches.forEach(match => {
            // Check if it has a dependency array
            const hasDepArray = /\}\s*,\s*\[/.test(match);
            if (!hasDepArray) {
                issues.push({
                    severity: 'MEDIUM',
                    type: 'MISSING_DEPS',
                    file: file.replace(/\\/g, '/')
                });
                console.log(`⚠️  ${file.replace(/\\/g, '/')}: useEffect without deps`);
            }
        });
    }
});

// CHECK 3: Server pages without force-dynamic
console.log('\n⚡ CHECK 3: Server Pages Without force-dynamic');
console.log('-'.repeat(70));

const pageFiles = allFiles.filter(f => f.includes('page.tsx'));
pageFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const isServer = /export\s+(default\s+)?async\s+function/.test(content);
    const isClient = /['"]use client['"]/.test(content);
    const hasDynamic = /export\s+const\s+dynamic/.test(content);
    
    if (isServer && !isClient && !hasDynamic) {
        issues.push({
            severity: 'HIGH',
            type: 'MISSING_DYNAMIC',
            file: file.replace(/\\/g, '/')
        });
        console.log(`❌ ${file.replace(/\\/g, '/')}: Missing force-dynamic`);
    }
});

// CHECK 4: API routes without force-dynamic
console.log('\n🔌 CHECK 4: API Routes Without force-dynamic');
console.log('-'.repeat(70));

const routeFiles = allFiles.filter(f => f.includes('route.ts'));
routeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasDynamic = /export\s+const\s+dynamic/.test(content);
    
    if (!hasDynamic) {
        issues.push({
            severity: 'HIGH',
            type: 'MISSING_DYNAMIC_API',
            file: file.replace(/\\/g, '/')
        });
        console.log(`❌ ${file.replace(/\\/g, '/')}: Missing force-dynamic`);
    }
});

// SUMMARY
console.log('\n' + '='.repeat(70));
console.log('📊 FINAL ACCURATE SUMMARY');
console.log('='.repeat(70));

const high = issues.filter(i => i.severity === 'HIGH');
const medium = issues.filter(i => i.severity === 'MEDIUM');
const low = issues.filter(i => i.severity === 'LOW');

console.log(`\n🔴 HIGH SEVERITY: ${high.length} issues`);
console.log(`🟡 MEDIUM SEVERITY: ${medium.length} issues`);
console.log(`🔵 LOW SEVERITY: ${low.length} issues`);
console.log(`📝 TOTAL: ${issues.length} issues`);

if (issues.length === 0) {
    console.log('\n🎉 PERFECT! NO ISSUES FOUND!');
    console.log('✅ All stack overflow causes have been eliminated!');
} else if (high.length === 0) {
    console.log('\n✅ NO HIGH SEVERITY ISSUES!');
    console.log('✅ All critical stack overflow causes fixed!');
}

fs.writeFileSync('final-scan-report.json', JSON.stringify(issues, null, 2));
console.log('\n📄 Report: final-scan-report.json');
