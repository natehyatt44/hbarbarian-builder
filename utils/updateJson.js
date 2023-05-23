const fs = require('fs');
const path = require('path');
const basePath = process.cwd();
const buildDir = `${basePath}/build/json`;

const folderPath = buildDir; // Use buildDir as the folder path
const newName = `Hbarbarians - Community Founder's Pass`
const newDescription = `Discover the Hbarbarians - Community Founder's Pass, an immersive ARG experience that unlocks a world of exclusivity. As a holder, you gain privileged access to future Hbarbarians Collections and Airdrops, accompanied by a treasure trove of benefits and unparalleled utility along your journey.`;
const newCreator = 'Hbarbarians'

function updateDescription(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return;
    }

    let json;
    try {
      json = JSON.parse(data);
    } catch (err) {
      console.error(`Error parsing JSON from file ${filePath}:`, err);
      return;
    }

    json.name = newName;
    json.description = newDescription;
    json.custom_fields.creator = newCreator

    fs.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8', (err) => {
      if (err) {
        console.error(`Error writing to file ${filePath}:`, err);
        return;
      }
      console.log(`Description updated for file: ${filePath}`);
    });
  });
}

fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error(`Error reading directory ${folderPath}:`, err);
    return;
  }

  files.forEach((file) => {
    const fileNumber = parseInt(file.match(/\d+/));
    if (fileNumber >= 1 && fileNumber <= 500) {
      updateDescription(path.join(folderPath, file));
    }
  });
});
