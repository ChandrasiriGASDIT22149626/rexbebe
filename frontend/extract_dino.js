const sharp = require('sharp');
const path = require('path');

const logoPath = path.join(__dirname, 'public/images/logo.png');
const outputPath = path.join(__dirname, 'public/images/dino_character.png');

async function extractDinosaur() {
  const metadata = await sharp(logoPath).metadata();
  console.log('Logo dimensions:', metadata.width, metadata.height);

  // The dinosaur character sits on the left side of the logo image
  // Crop the left ~45% of width and full height
  const dinoWidth = Math.floor(metadata.width * 0.44);

  await sharp(logoPath)
    .extract({
      left: 0,
      top: 0,
      width: dinoWidth,
      height: metadata.height
    })
    .toFile(outputPath);

  console.log('Successfully extracted dinosaur character to dino_character.png');
}

extractDinosaur().catch(console.error);
