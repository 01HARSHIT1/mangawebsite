const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function comparePDFTools() {
    const pdfPath = path.join(__dirname, 'testmanga', 'One Piece - CH 1135 @Anime_Bundle.pdf');

    if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF file not found at: ${pdfPath}`);
    }

    console.log('📖 PDF found, testing both tools...');
    console.log('PDF Path:', pdfPath);
    console.log('PDF Size:', (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2), 'MB');
    console.log('');

    // Test 1: pdf2image
    console.log('🔄 Testing Tool 1: pdf2image');
    console.log('================================');

    try {
        // Create temp directory for pdf2image
        const pdf2imageDir = './temp_pdf2image';
        if (!fs.existsSync(pdf2imageDir)) {
            fs.mkdirSync(pdf2imageDir, { recursive: true });
        }

        // Test pdf2image
        const pdf2imageCommand = `pdf2image -f 1 -l 3 -o "${pdf2imageDir}/page" -fmt png "${pdfPath}"`;
        console.log('Running command:', pdf2imageCommand);

        const { stdout: pdf2imageOutput, stderr: pdf2imageError } = await execAsync(pdf2imageCommand);
        console.log('pdf2image output:', pdf2imageOutput);
        if (pdf2imageError) console.log('pdf2image stderr:', pdf2imageError);

        // Check results
        const pdf2imageFiles = fs.readdirSync(pdf2imageDir).filter(file => file.endsWith('.png')).sort();
        console.log(`✅ pdf2image generated ${pdf2imageFiles.length} pages`);

        if (pdf2imageFiles.length > 0) {
            const firstImage = path.join(pdf2imageDir, pdf2imageFiles[0]);
            const stats = fs.statSync(firstImage);
            console.log(`   First image size: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   First image path: ${firstImage}`);
        }

    } catch (error) {
        console.log('❌ pdf2image failed:', error.message);
    }

    console.log('');

    // Test 2: magicimage
    console.log('🔄 Testing Tool 2: magicimage');
    console.log('================================');

    try {
        // Create temp directory for magicimage
        const magicimageDir = './temp_magicimage';
        if (!fs.existsSync(magicimageDir)) {
            fs.mkdirSync(magicimageDir, { recursive: true });
        }

        // Test magicimage
        const magicimageCommand = `magicimage -i "${pdfPath}" -o "${magicimageDir}/page" -f png -p 1-3`;
        console.log('Running command:', magicimageCommand);

        const { stdout: magicimageOutput, stderr: magicimageError } = await execAsync(magicimageCommand);
        console.log('magicimage output:', magicimageOutput);
        if (magicimageError) console.log('magicimage stderr:', magicimageError);

        // Check results
        const magicimageFiles = fs.readdirSync(magicimageDir).filter(file => file.endsWith('.png')).sort();
        console.log(`✅ magicimage generated ${magicimageFiles.length} pages`);

        if (magicimageFiles.length > 0) {
            const firstImage = path.join(magicimageDir, magicimageFiles[0]);
            const stats = fs.statSync(firstImage);
            console.log(`   First image size: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   First image path: ${firstImage}`);
        }

    } catch (error) {
        console.log('❌ magicimage failed:', error.message);
    }

    // Test 3: Compare with our working Poppler solution
    console.log('');
    console.log('🔄 Testing Tool 3: Poppler (pdftoppm) - Our Working Solution');
    console.log('============================================================');

    try {
        // Create temp directory for poppler
        const popplerDir = './temp_poppler';
        if (!fs.existsSync(popplerDir)) {
            fs.mkdirSync(popplerDir, { recursive: true });
        }

        // Test poppler
        const popplerCommand = `pdftoppm -png -r 300 -f 1 -l 3 "${pdfPath}" "${popplerDir}/page"`;
        console.log('Running command:', popplerCommand);

        const { stdout: popplerOutput, stderr: popplerError } = await execAsync(popplerCommand);
        console.log('poppler output:', popplerOutput);
        if (popplerError) console.log('poppler stderr:', popplerError);

        // Check results
        const popplerFiles = fs.readdirSync(popplerDir).filter(file => file.endsWith('.png')).sort();
        console.log(`✅ Poppler generated ${popplerFiles.length} pages`);

        if (popplerFiles.length > 0) {
            const firstImage = path.join(popplerDir, popplerFiles[0]);
            const stats = fs.statSync(firstImage);
            console.log(`   First image size: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   First image path: ${firstImage}`);
        }

    } catch (error) {
        console.log('❌ Poppler failed:', error.message);
    }

    console.log('');
    console.log('🎯 Summary:');
    console.log('===========');
    console.log('1. pdf2image: Tested');
    console.log('2. magicimage: Tested');
    console.log('3. Poppler (pdftoppm): Tested');
    console.log('');
    console.log('📁 Check the temp directories to see the results:');
    console.log('   - ./temp_pdf2image/');
    console.log('   - ./temp_magicimage/');
    console.log('   - ./temp_poppler/');
}

// Run the comparison
comparePDFTools()
    .then(() => {
        console.log('\n🎉 Tool comparison completed!');
        console.log('Check the results above to see which tool works best.');
    })
    .catch(error => {
        console.error('💥 Comparison failed:', error);
        process.exit(1);
    });
