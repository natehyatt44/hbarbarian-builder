const basePath = process.cwd();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { env } = require('process');

fs.writeFileSync(`${basePath}/build/json/_ipfsMetas.json`, "");
const writter = fs.createWriteStream(`${basePath}/build/json/_ipfsMetas.json`, {flags: "a",});
writter.write("[");
const readDir = `${basePath}/build/json`;
let fileCount = fs.readdirSync(readDir).length - 2;

fs.readdirSync(`${basePath}/build/json`).
    forEach(file => {
        if (file == `_metadata.json` || file == '_ipfsMetas.json')
        return;

        const jsonFile = fs.readFileSync(`${readDir}/${file}`) 

        const options = {
            method: 'POST',
            headers: {
                "Cotent-Type": "application/json",
                Authorization: '15375d2e-a984-4730-a31e-af241f34ddce'
            },
            body: jsonFile
        };

        fetch("https://api.nftport.xyz/v0/metadata", options)
            .then((res) => res.json())
            .then((json) => {
                writter.write(JSON.stringify(json, null, 2));
                fileCount--;

                if(fileCount == 0){
                    writter.write("]");
                    writter.end();
                } else {
                    writter.write(",\n");
                }

                console.log(`${json.name} metadata uploaded & added to _ipfsMetas.json`);
            })
            .catch((err) => console.error("error" + err));
});
