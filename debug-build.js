// Debug script to identify stack overflow source
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting build debug analysis...\n');

// Track which files are being processed
const processedFiles = new Set();
let callDepth = 0;
const MAX_DEPTH = 50;

// Intercept require to track imports
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
    callDepth++;

    if (callDepth > MAX_DEPTH) {
        console.error(`\n❌ STACK OVERFLOW DETECTED at depth ${callDepth}`);
        console.error(`Last module: ${id}`);
        console.error(`Call stack depth exceeded ${MAX_DEPTH}`);
        console.trace();
        process.exit(1);
    }

    // Track circular dependencies
    if (processedFiles.has(id)) {
        console.warn(`⚠️  Circular dependency detected: ${id} (depth: ${callDepth})`);
    }

    processedFiles.add(id);

    // Log deep imports
    if (callDepth > 30) {
        console.log(`⚠️  Deep import (${callDepth}): ${id}`);
    }

    try {
        const result = originalRequire.apply(this, arguments);
        callDepth--;
        return result;
    } catch (error) {
        console.error(`\n❌ Error loading module: ${id}`);
        console.error(`Depth: ${callDepth}`);
        console.error(error.message);
        callDepth--;
        throw error;
    }
};

console.log('✅ Debug hooks installed');
console.log('📦 Starting Next.js build with monitoring...\n');

// Run the actual build
require('child_process').execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
});
