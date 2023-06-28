const fetch = require("node-fetch");
const fs = require("fs");

const tokenId = '0.0.2371643';
const accountId = '0.0.1757800';

async function fetchNFTsFromMirrorNode(nextUrl = null) {
  const url = 'https://mainnet-public.mirrornode.hedera.com';
  const path = nextUrl || `/api/v1/accounts/${accountId}/nfts`;

  const response = await fetch(`${url}${path}`);
  const nfts = await response.json();

  let nftData = new Set(); // Use a Set to store unique IDs

  if (nfts.nfts.length > 0) {
    for (const item of nfts.nfts) {
      if (item.token_id === tokenId) {
        const ipfsHash = item.metadata;
        const metadata = Buffer.from(ipfsHash, 'base64');
        const cid = metadata.toLocaleString();

        nftData.add(cid); // Add ID to the Set
      }
    }
  }

  if (nfts.links && nfts.links.next) {
    const additionalData = await fetchNFTsFromMirrorNode(nfts.links.next);
    additionalData.forEach((id) => nftData.add(id)); // Add additional unique IDs
  }

  return Array.from(nftData); // Convert Set to an array and return
}

async function main() {
  const uniqueNFTs = await fetchNFTsFromMirrorNode();
  console.log(uniqueNFTs);
  console.log('Count of unique NFTs:', uniqueNFTs.length);
}

main();
