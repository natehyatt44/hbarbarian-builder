const fetch = require("node-fetch");
const fs = require("fs");

const tokenIdCFP = '0.0.2235264';

async function main() {
  const nftData = await fetchNFTsFromMirrorNode();
  const nftDataWithIPFS = await fetchIPFSMetadata(nftData);
  console.log(nftDataWithIPFS)
  // Write the NFT data with IPFS metadata to a JSON file
  fs.writeFileSync('nfts.json', JSON.stringify(nftDataWithIPFS, null, 2));
  console.log('JSON file created: nfts.json');
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
      const metadataResponse = await fetch(`${url}/api/v1/tokens/${item.token_id}/nfts/${item.serial_number}/`);
      const response = await metadataResponse.json();
      const ipfsHash = response.metadata;
      const serial_number = response.serial_number;
      const metadata = Buffer.from(ipfsHash, 'base64');
      const cid = metadata.toLocaleString();
      const cidUse = cid.replace('ipfs://', '');

      nftData.push({ serial_number: serial_number, ipfsCid: cidUse });
    }
  }

  if (nfts.links && nfts.links.next) {
    nftData = nftData.concat(await fetchNFTsFromMirrorNode(nfts.links.next));
  }

  return nftData;
}

async function fetchIPFSMetadata(nftData) {
  const ipfsGateway = 'https://ipfs.io/ipfs/';

  for (const nft of nftData) {
    if (nft.ipfsCid) {
      const ipfsMetadataResponse = await fetchWithRetries(`${ipfsGateway}${nft.ipfsCid}`);
      const ipfsMetadata = await ipfsMetadataResponse.json();
      nft.edition = ipfsMetadata.edition;
      nft.traits = ipfsMetadata.attributes[7];
    }
  }

  return nftData;
}

main();
