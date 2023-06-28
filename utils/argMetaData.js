const fetch = require("node-fetch");
const fs = require("fs");

const tokenIdCFP = '0.0.2235264';

async function main() {
  const nftData = await fetchNFTsFromMirrorNode();
  fs.writeFileSync('nftMirroNode.json', JSON.stringify(nftData, null, 2));
  const nftDataWithIPFS = await fetchIPFSMetadata(nftData);
  fs.writeFileSync('nftIpfs.json', JSON.stringify(nftDataWithIPFS, null, 2));

  // Read from the nftipfs JSON file and parse the data into a const
  const dataFromFile = JSON.parse(fs.readFileSync('nftIpfs.json', 'utf8'));
  // Remove the ipfsCid from each object
  for (const item of dataFromFile) {
    delete item.ipfsCid;
    item.playable = 1
  }

  fs.writeFileSync('argNfts.json', JSON.stringify(dataFromFile, null, 2));
}



const fetchWithRetries = async (url, maxRetries = 3) => {
    let retries = 0;
    let response;
  
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
    while (retries < maxRetries) {
      try {
        response = await fetch(url);
        if (!response.ok) {
          await delay(3000); // Wait for 3 seconds after the first retry
          throw new Error('Fetch failed');
        }
        break;
      } catch (error) {
        retries++;
        console.log(`Retrying fetch (${retries}/${maxRetries}):`, error.message);
        if (retries === maxRetries) {
          throw new Error('Max retries reached');
        }
        
      }
    }
  
    return response;
  };

async function fetchNFTsFromMirrorNode(nextUrl = null) {
  const url = 'https://mainnet-public.mirrornode.hedera.com';
  const path = nextUrl || `/api/v1/tokens/${tokenIdCFP}/nfts?limit=100`;

  const response = await fetch(`${url}${path}`);
  const nfts = await response.json();

  let nftData = [];
  if (nfts.nfts.length > 0) {
    for (const item of nfts.nfts) {
      //const metadataResponse = await fetch(`${url}/api/v1/tokens/${item.token_id}/nfts/${item.serial_number}/`);
      //const response = await metadataResponse.json();
      const ipfsHash = item.metadata;
      const serial_number = item.serial_number;
      const metadata = Buffer.from(ipfsHash, 'base64');
      const cid = metadata.toLocaleString();
      const cidUse = cid.replace('ipfs://', '');

      nftData.push({ serial_number: serial_number, ipfsCid: cidUse });
      console.log(nftData)
    }
  }

  if (nfts.links && nfts.links.next) {
    nftData = nftData.concat(await fetchNFTsFromMirrorNode(nfts.links.next));
  }
  console.log(nftData)
  return nftData;
}

async function fetchIPFSMetadata(nftData) {
  const ipfsGateway = 'https://ipfs.io/ipfs/';

  for (const nft of nftData) {
    if (nft.ipfsCid) {
      const ipfsMetadataResponse = await fetchWithRetries(`${ipfsGateway}${nft.ipfsCid}`);
      const ipfsMetadata = await ipfsMetadataResponse.json();
      nft.edition = ipfsMetadata.edition;
      nft.race = ipfsMetadata.attributes[7].value;
      console.log(nft)
    }
  }

  return nftData;
}

main();
