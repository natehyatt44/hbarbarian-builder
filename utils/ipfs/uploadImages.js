require("dotenv").config();
const FormData = require("form-data");
const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
const { RateLimit } = require('async-sema');
const { fetchWithRetry } = require(`${basePath}/utils/functions/fetchWithRetry.js`);
const buildPath = 'build'

const allMetadata = [];
const regex = new RegExp("^([0-9]+).jpg");
const _limit = RateLimit(2);

async function main() {
  console.log("Starting upload of images...");
  const files = fs.readdirSync(`${basePath}/${buildPath}/images`);
  files.sort(function(a, b){
    return a.split(".")[0] - b.split(".")[0];
  });
  for (const file of files) {
    try {
      if (regex.test(file)) {
        const fileName = path.parse(file).name;

        let jsonFile = fs.readFileSync(`${basePath}/${buildPath}/json/${fileName}.json`);
        let metaData = JSON.parse(jsonFile);

        if(!metaData.file_url.includes('https://')) {
          await _limit()
          const url = "https://api.nftport.xyz/v0/files";
          const formData = new FormData();
          const fileStream = fs.createReadStream(`${basePath}/${buildPath}/images/${file}`);
          formData.append("file", fileStream);
          const options = {
            method: "POST",
            headers: {Authorization: process.env.NFT_PORT_KEY},
            body: formData,
          };

          const response = await fetchWithRetry(url, options);
          metaData.file_url = response.ipfs_url;

          fs.writeFileSync(
            `${basePath}/${buildPath}/json/${fileName}.json`,
            JSON.stringify(metaData, null, 2)
          );
          console.log(`Uploaded ${response.file_name} And Updated ${fileName}.json with IPFS Image URI: ${metaData.file_url}`);
        } else {
          console.log(`${fileName} already uploaded.`);
        }

        allMetadata.push(metaData);
      }
    } catch (error) {
      console.log(`Catch: ${error}`);
    }
  }

  fs.writeFileSync(
    `${basePath}/${buildPath}/json/_metadata.json`,
    JSON.stringify(allMetadata, null, 2)
  );
}

main();