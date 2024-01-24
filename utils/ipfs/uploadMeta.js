require("dotenv").config();
const path = require("path");
const basePath = process.cwd();
const fs = require("fs");
const { RateLimit } = require("async-sema");
const { fetchWithRetry } = require(`${basePath}/utils/functions/fetchWithRetry.js`);
const buildPath = 'build'

const _limit = RateLimit(2);
const regex = new RegExp("^([0-9]+).json$");

if (!fs.existsSync(path.join(`${basePath}/${buildPath}`, "/ipfsMetas"))) {
  fs.mkdirSync(path.join(`${basePath}/${buildPath}`, "ipfsMetas"));
}

let readDir = `${basePath}/${buildPath}/json`;
let writeDir = `${basePath}/${buildPath}/ipfsMetas`;

async function main() {

  console.log(`Starting upload of metadata...`);

  const allMetadata = [];
  const allCIDS = [];

  const files = fs.readdirSync(readDir);
  files.sort(function (a, b) {
    return a.split(".")[0] - b.split(".")[0];
  });

  for (const file of files) {
    if (regex.test(file)) {

      let rawFile = fs.readFileSync(`${readDir}/${file}`);
      let metaData = JSON.parse(rawFile);
      let jsonFile = JSON.stringify(rawFile, null, 2)
      const uploadedMeta = `${writeDir}/${metaData.edition}.json`;

      try {
        fs.accessSync(uploadedMeta);
        const uploadedMetaFile = fs.readFileSync(uploadedMeta);
        if (uploadedMetaFile.length > 0) {
          const ipfsMeta = JSON.parse(uploadedMetaFile);
          if (ipfsMeta.response !== "OK") throw "metadata not uploaded";
          allMetadata.push(ipfsMeta);
          console.log(`${metaData.name} metadata already uploaded`);
        } else {
          throw "metadata not uploaded";
        }
      } catch (err) {
        try {
          await _limit();
          const url = "https://api.nftport.xyz/v0/metadata";
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authentication: process.env.NFT_PORT_KEY
            },
            body: rawFile,
          };

          const response = await fetchWithRetry(url, options);
          allMetadata.push(response);
          allCIDS.push(response.metadata_uri)

          fs.writeFileSync(uploadedMeta, JSON.stringify(response, null, 2));

          console.log(`Uploaded ${response.name} And Updated ipfsMeta and CID files with IPFS Metadata`)
        } catch (err) {
          console.log(`Catch: ${err}`);
        }
      }
    }
    fs.writeFileSync(
      `${writeDir}/_ipfsMetas.json`,
      JSON.stringify(allMetadata, null, 2)
    );
    fs.writeFileSync(
        `${writeDir}/_CID.json`,
        JSON.stringify(allCIDS, null, 2)
      );
  }
}

main();