const { validator, defaultVersion, localValidation } = require('@hashgraph/nft-utilities');

// Pull metadata from IPFS and insert here to test 

const metadataInstance = 
{"name":"Bussin MFer #13","description":"These fellas are bussin","image":"https://ipfs.io/ipfs/bafkreigs45mnnrbwpmqpoaey3l7gycttg7vdudxfmc2nvyildxtat3xki4","attributes":[{"trait_type":"Background","value":"Black"},{"trait_type":"Bottom Lid","value":"Middle"},{"trait_type":"Eye color","value":"Yellow"},{"trait_type":"Eyeball","value":"Red"},{"trait_type":"Goo","value":"Green"},{"trait_type":"Iris","value":"Small"},{"trait_type":"Shine","value":"Shapes"},{"trait_type":"Muscle","value":"Flex"}],"creator":"MFer","type":"image/png","format":"HIP412@1.0.0","properties":{"id":13}}
const results = validator(metadataInstance); // by default: verifies metadata against HIP412@2.0.0
console.log(results);
