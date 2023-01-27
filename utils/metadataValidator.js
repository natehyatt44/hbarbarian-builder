const { validator, defaultVersion, localValidation } = require('@hashgraph/nft-utilities');

// Pull metadata from IPFS and insert here to test 

const metadataInstance = 

{"name":"Bussin MFer #184","description":"These fellas are bussin","image":"https://ipfs.io/ipfs/bafkreibq26dchepiwplfr4akmx4cu5mnurh7z5gvjmwx4fcu4wkdxzqfyu","attributes":[{"trait_type":"Background","value":"Black"},{"trait_type":"Bottom Lid","value":"Low"},{"trait_type":"Eye color","value":"Pink"},{"trait_type":"Eyeball","value":"Red"},{"trait_type":"Goo","value":"Green"},{"trait_type":"Iris","value":"Medium"},{"trait_type":"Shine","value":"Shapes"},{"trait_type":"Muscle","value":"Flex"},{"trait_type":"Top lid","value":"Middle"}],"creator":"MFer","type":"image/png","format":"HIP412@1.0.0","properties":{"id":184}}

const results = validator(metadataInstance); // by default: verifies metadata against HIP412@2.0.0
console.log(results);
