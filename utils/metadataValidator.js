const { validator, defaultVersion, localValidation } = require('@hashgraph/nft-utilities');

// Pull metadata from IPFS and insert here to test 

const metadataInstance = 

{"name":"test #1","description":"test","image":"https://ipfs.io/ipfs/bafybeie4m5znuuuirsdpj66q74bgp6oal3l2eyb6otzzaktr7diuxj2gtq","attributes":[{"trait_type":"Background","value":"White"},{"trait_type":"Body","value":"Blonde"},{"trait_type":"Clothes","value":"Handmade Shirt"},{"trait_type":"Hair Hat","value":"Mullet Black"},{"trait_type":"Eyes Nose","value":"Crying"},{"trait_type":"Mouth","value":"Happy"},{"trait_type":"Accessory","value":"King Dice"},{"trait_type":"Race","value":"Mortal"}],"creator":"BarbarianInc","type":"image/png","format":"HIP412@1.0.0","properties":{"id":1}}
const results = validator(metadataInstance); // by default: verifies metadata against HIP412@2.0.0
console.log(results);
