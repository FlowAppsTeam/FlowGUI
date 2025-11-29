const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'icon.png');
const outputPath = path.join(__dirname, 'icon.ico');

const pngBuffer = fs.readFileSync(inputPath);

toIco([pngBuffer], {
    sizes: [16, 24, 32, 48, 64, 128, 256],
    resize: true
})
    .then(buf => {
        fs.writeFileSync(outputPath, buf);
        console.log('✓ Icon converted successfully to ICO format!');
        console.log('  Sizes: 16, 24, 32, 48, 64, 128, 256');
        console.log('  Output:', outputPath);
    })
    .catch(err => {
        console.error('✗ Error:', err.message);
        process.exit(1);
    });
