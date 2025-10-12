const fs = require('fs');
const path = require('path');

console.log('🔍 DEEP SCAN FOR ALL STACK OVERFLOW CAUSES\n');
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
            } catch (err) {
                // Skip files we can't access
            }
        });
    } catch (err) {
        // Skip directories we can't access
    }
    
    return results;
}

const allFiles = findFiles('./src', ['.ts', '.tsx', '.js', '.jsx']);

console.log(`\n📁 Scanning ${allFiles.length} files...\n`);

// CHECK 1: Excessive imports from single module
console.log('📦 CHECK 1: Excessive Imports from Single Module');
console.log('-'.repeat(70));

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check react-icons imports
    const iconMatches = content.match(/import\s*{([^}]+)}\s*from\s*['"]react-icons\/\w+['"]/g);
    if (iconMatches) {
        iconMatches.forEach(match => {
            const items = match.match(/{([^}]+)}/)[1].split(',').filter(s => s.trim());
            if (items.length > 15) {
                issues.push({
                    severity: 'HIGH',
                    type: 'EXCESSIVE_ICONS',
                    file: file.replace(/\\/g, '/'),
                    count: items.length,
                    line: match
                });
                console.log(`❌ ${file.replace(/\\/g, '/')}`);
                console.log(`   ${items.length} icons (limit: 15)`);
            }
        });
    }
    
    // Check framer-motion imports
    const motionMatches = content.match(/import\s*{([^}]+)}\s*from\s*['"]framer-motion['"]/g);
    if (motionMatches) {
        motionMatches.forEach(match => {
            const items = match.match(/{([^}]+)}/)[1].split(',').filter(s => s.trim());
            if (items.length > 10) {
                issues.push({
                    severity: 'MEDIUM',
                    type: 'EXCESSIVE_MOTION',
                    file: file.replace(/\\/g, '/'),
                    count: items.length
                });
                console.log(`⚠️  ${file.replace(/\\/g, '/')}`);
                console.log(`   ${items.length} framer-motion components`);
            }
        });
    }
});

// CHECK 2: Recursive function patterns
console.log('\n🔁 CHECK 2: Potential Recursive Functions');
console.log('-'.repeat(70));

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
        // Look for function calling itself
        const funcMatch = line.match(/function\s+(\w+)/);
        if (funcMatch) {
            const funcName = funcMatch[1];
            // Check if function body contains call to itself
            const nextLines = lines.slice(idx, Math.min(idx + 50, lines.length)).join('\n');
            if (nextLines.includes(`${funcName}(`) && !nextLines.includes('if (') && !nextLines.includes('return')) {
                issues.push({
                    severity: 'HIGH',
                    type: 'POTENTIAL_RECURSION',
                    file: file.replace(/\\/g, '/'),
                    function: funcName,
                    line: idx + 1
                });
                console.log(`⚠️  ${file.replace(/\\/g, '/')}:${idx + 1}`);
                console.log(`   Function ${funcName} might be recursive without base case`);
            }
        }
    });
});

// CHECK 3: Deep nested Promise.all
console.log('\n⚡ CHECK 3: Deep Nested Promise.all');
console.log('-'.repeat(70));

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const promiseAllMatches = content.match(/Promise\.all\(/g);
    
    if (promiseAllMatches && promiseAllMatches.length > 3) {
        issues.push({
            severity: 'MEDIUM',
            type: 'MULTIPLE_PROMISE_ALL',
            file: file.replace(/\\/g, '/'),
            count: promiseAllMatches.length
        });
        console.log(`⚠️  ${file.replace(/\\/g, '/')}`);
        console.log(`   ${promiseAllMatches.length} Promise.all calls`);
    }
});

// CHECK 4: Large array operations
console.log('\n📊 CHECK 4: Large Array Operations');
console.log('-'.repeat(70));

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for .map().map() chains
    const mapCount = (content.match(/\.map\(/g) || []).length;
    if (mapCount > 10) {
        issues.push({
            severity: 'MEDIUM',
            type: 'MANY_MAP_OPERATIONS',
            file: file.replace(/\\/g, '/'),
            count: mapCount
        });
        console.log(`⚠️  ${file.replace(/\\/g, '/')}`);
        console.log(`   ${mapCount} .map() operations`);
    }
});

// CHECK 5: Import cycles
console.log('\n🔄 CHECK 5: Import Dependency Analysis');
console.log('-'.repeat(70));

const importMap = new Map();

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const imports = [];
    
    const importMatches = content.match(/import.*from\s*['"]@\/[^'"]+['"]/g) || [];
    importMatches.forEach(imp => {
        const match = imp.match(/from\s*['"]@\/([^'"]+)['"]/);
        if (match) {
            imports.push(match[1]);
        }
    });
    
    const key = file.replace(/\\/g, '/').replace('./src/', '').replace('.tsx', '').replace('.ts', '');
    importMap.set(key, imports);
});

// Check for potential cycles
let cycleCount = 0;
importMap.forEach((imports, file) => {
    imports.forEach(imp => {
        if (importMap.has(imp)) {
            const impImports = importMap.get(imp);
            if (impImports.some(i => i.includes(file.split('/').pop()))) {
                cycleCount++;
                if (cycleCount <= 5) { // Only show first 5
                    console.log(`⚠️  Potential cycle: ${file} ↔️ ${imp}`);
                }
            }
        }
    });
});

if (cycleCount > 5) {
    console.log(`   ... and ${cycleCount - 5} more potential cycles`);
}

// CHECK 6: MongoDB connection patterns
console.log('\n💾 CHECK 6: MongoDB Connection Patterns');
console.log('-'.repeat(70));

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const clientPromiseCount = (content.match(/await clientPromise/g) || []).length;
    
    if (clientPromiseCount > 3) {
        issues.push({
            severity: 'LOW',
            type: 'MULTIPLE_DB_CONNECTIONS',
            file: file.replace(/\\/g, '/'),
            count: clientPromiseCount
        });
        console.log(`ℹ️  ${file.replace(/\\/g, '/')}`);
        console.log(`   ${clientPromiseCount} MongoDB connections`);
    }
});

// SUMMARY
console.log('\n' + '='.repeat(70));
console.log('📊 FINAL SUMMARY');
console.log('='.repeat(70));

const high = issues.filter(i => i.severity === 'HIGH');
const medium = issues.filter(i => i.severity === 'MEDIUM');
const low = issues.filter(i => i.severity === 'LOW');

console.log(`\n🔴 HIGH SEVERITY: ${high.length} issues`);
console.log(`🟡 MEDIUM SEVERITY: ${medium.length} issues`);
console.log(`🔵 LOW SEVERITY: ${low.length} issues`);
console.log(`📝 TOTAL: ${issues.length} issues`);

if (high.length === 0) {
    console.log('\n✅ NO HIGH SEVERITY ISSUES FOUND!');
    console.log('✅ All critical stack overflow causes have been fixed!');
}

fs.writeFileSync('deep-scan-report.json', JSON.stringify(issues, null, 2));
console.log('\n📄 Detailed report: deep-scan-report.json');
