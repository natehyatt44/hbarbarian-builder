const basePath = process.cwd();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { env } = require('process');

fs.readdirSync(`${basePath}/build/images`).
    forEach(file => {
        const form = new FormData();
        const fileStream = fs.createReadStream(`${basePath}/build/images/${file}`);
        form.append("file", fileStream)

        const options = {
            method: 'POST',
            headers: {
                Authorization: '15375d2e-a984-4730-a31e-af241f34ddce'
            },
            body: form
        };

        fetch("https://api.nftport.xyz/v0/files", options)
            .then((res) => res.json())
            .then((json) => {
                const fileName = path.parse(json.file_name).name;
                let rawdata = fs.readFileSync(`${basePath}/build/json/${fileName}.json`);
                let metaData = JSON.parse(rawdata);

                metaData.file_url = json.ipfs_url;
                metaData.custom_fields.files[0].uri = json.ipfs_url;

                fs.writeFileSync(`${basePath}/build/json/${fileName}.json`, JSON.stringify(metaData, null, 2));

                console.log(`${json.file_name} uploaded & ${fileName}.json updated`);
            })
            .catch((err) => console.error("error" + err));
});
