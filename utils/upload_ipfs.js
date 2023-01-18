const basePath = process.cwd();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { env } = require('process');

const exampleFile = new File(['foo'], 'foo.txt', { type: 'text/plain'});

// async function fileFromPath(filePath) {
//     const content = await fs.promises.readFile(filePath)
//     //const type = mime.getType(filePath)
//     return new File([content], path.basename(filePath), { type })
// }

console.log(exampleFile)

// fs.readdirSync(`${basePath}/build/images`).
//     forEach(file => {
//         const form = new FormData();
//         const fileStream = fs.createReadStream(`${basePath}/build/images/${file}`);
//         form.append("file", fileStream)
        const form = new FormData();
        const fileStream = fs.createReadStream(`/build/images/1.png`);
        form.append('file', fileStream)




        console.log(content)

        // const options = {
        //     method: 'POST',
        //     headers: {
        //         Authorization: '15375d2e-a984-4730-a31e-af241f34ddce'
        //     },
        //     file: exampleFile
        // };

        // fetch("https://api.nftport.xyz/v0/files", options)
        //     .then(response => {
        //         return response.json()
        //     })
        //     .then(responseJson => {
        //         // Handle the response
        //         console.log(responseJson);
        //     })
// });
