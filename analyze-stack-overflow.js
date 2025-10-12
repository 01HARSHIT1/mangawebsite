const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE STACK OVERFLOW ANALYSIS\n');
console.log('='.repeat(60));

const issues = [];

// Function to recursively find all files
function findFiles(dir, ext) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(findFiles(filePath, ext));
            }
        } else if (file.endsWith(ext)) {
            results.push(filePath);
        }
    });

    return results;
}

// Check 1: Excessive icon imports
console.log('\n📦 CHECK 1: Excessive Icon Imports');
console.log('-'.repeat(60));

const tsxFiles = findFiles('./src', '.tsx');
const tsFiles = findFiles('./src', '.ts');
const allFiles = [...tsxFiles, ...tsFiles];

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const iconImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]react-icons\/\w+['"]/g);

    if (iconImportMatch) {
        iconImportMatch.forEach(importLine => {
            const icons = importLine.match(/{([^}]+)}/)[1].split(',').map(s => s.trim());
            if (icons.length > 15) {
                issues.push({
                    type: 'EXCESSIVE_ICONS',
                    severity: 'HIGH',
                    file: file.replace(/\\/g, '/'),
                    count: icons.length,
                    message: `${icons.length} icons imported (recommended: <15)`
                });
                console.log(`⚠️  ${file.replace(/\\/g, '/')}`);
                console.log(`   ${icons.length} icons imported`);
            }
        });
    }
});

// Check 2: Large recharts imports
console.log('\n📊 CHECK 2: Large Recharts Imports');
console.log('-'.repeat(60));

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const rechartsMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]recharts['"]/g);

    if (rechartsMatch) {
        rechartsMatch.forEach(importLine => {
            const components = importLine.match(/{([^}]+)}/)[1].split(',').map(s => s.trim());
            if (components.length > 20) {
                issues.push({
                    type: 'EXCESSIVE_RECHARTS',
                    severity: 'MEDIUM',
                    file: file.replace(/\\/g, '/'),
                    count: components.length,
                    message: `${components.length} recharts components imported`
                });
                console.log(`⚠️  ${file.replace(/\\/g, '/')}`);
                console.log(`   ${components.length} recharts components`);
            }
        });
    }
});

// Check 3: Potential circular dependencies
console.log('\n🔄 CHECK 3: Potential Circular Dependencies');
console.log('-'.repeat(60));

const importGraph = new Map();

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const imports = content.match(/import.*from\s*['"]@\/[^'"]+['"]/g) || [];

    const fileKey = file.replace(/\\/g, '/').replace('./src/', '');
    importGraph.set(fileKey, []);

    imports.forEach(imp => {
        const match = imp.match(/from\s*['"]@\/([^'"]+)['"]/);
        if (match) {
            importGraph.get(fileKey).push(match[1]);
        }
    });
});

// Simple circular dependency detection
importGraph.forEach((imports, file) => {
    imports.forEach(imp => {
        const impFile = imp + '.tsx';
        if (importGraph.has(impFile)) {
            const impImports = importGraph.get(impFile);
            if (impImports.some(i => i.includes(file.replace('.tsx', '').replace('.ts', '')))) {
                issues.push({
                    type: 'CIRCULAR_DEPENDENCY',
                    severity: 'HIGH',
                    file: file,
                    related: impFile,
                    message: `Circular dependency between ${file} and ${impFile}`
                });
                console.log(`⚠️  ${file} ↔️ ${impFile}`);
            }
        }
    });
});

// Check 4: Large file sizes
console.log('\n📏 CHECK 4: Large File Sizes');
console.log('-'.repeat(60));

allFiles.forEach(file => {
    const stats = fs.statSync(file);
    if (stats.size > 50000) { // >50KB
        issues.push({
            type: 'LARGE_FILE',
            severity: 'MEDIUM',
            file: file.replace(/\\/g, '/'),
            size: stats.size,
            message: `File size: ${(stats.size / 1024).toFixed(2)}KB (recommended: <50KB)`
        });
        console.log(`⚠️  ${file.replace(/\\/g, '/')} - ${(stats.size / 1024).toFixed(2)}KB`);
    }
});

// Check 5: useEffect without dependencies
console.log('\n🔁 CHECK 5: Potentially Problematic useEffect');
console.log('-'.repeat(60));

tsxFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');

    // Check for useEffect with state updates but no dependencies
    const useEffectMatches = content.match(/useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*set\w+\([^)]*\)[^}]*}\s*\)/g);

    if (useEffectMatches && useEffectMatches.length > 0) {
        useEffectMatches.forEach(match => {
            if (!match.includes(', []') && !match.includes(', [')) {
                issues.push({
                    type: 'MISSING_DEPENDENCIES',
                    severity: 'MEDIUM',
                    file: file.replace(/\\/g, '/'),
                    message: 'useEffect with state update but no dependency array'
                });
                console.log(`⚠️  ${file.replace(/\\/g, '/')}`);
                console.log(`   useEffect without dependencies`);
            }
        });
    }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));

const highSeverity = issues.filter(i => i.severity === 'HIGH');
const mediumSeverity = issues.filter(i => i.severity === 'MEDIUM');

console.log(`\n🔴 HIGH SEVERITY: ${highSeverity.length} issues`);
console.log(`🟡 MEDIUM SEVERITY: ${mediumSeverity.length} issues`);
console.log(`📝 TOTAL ISSUES: ${issues.length}`);

if (highSeverity.length > 0) {
    console.log('\n🚨 HIGH PRIORITY FIXES NEEDED:');
    highSeverity.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.type}`);
        console.log(`   File: ${issue.file}`);
        console.log(`   ${issue.message}`);
    });
}

// Write detailed report
fs.writeFileSync('stack-overflow-analysis.json', JSON.stringify(issues, null, 2));
console.log('\n✅ Detailed report saved to: stack-overflow-analysis.json');
