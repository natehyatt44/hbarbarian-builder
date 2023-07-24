const axios = require('axios');
require("dotenv").config();
const fs = require('fs');
const basePath = process.cwd();
const fileDir = `${basePath}/utils/files`;
const { TransferTransaction, PrivateKey, AccountId, Client } = require('@hashgraph/sdk');

// Configure the Hedera Client
const companyId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
const companyKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);

const client = Client.forMainnet().setOperator(companyId, companyKey);

const mirrorNodeApiBaseUrl = 'https://mainnet-public.mirrornode.hedera.com';
const companyWallet = process.env.COMPANY_WALLET_ID;
const royaltyWallet = process.env.ROYALTY_WALLET_ID;
const tokenId = '0.0.2361422'

async function getNFTs(next = '') {

  try {
    console.log(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${tokenId}/nfts${next}`)
    const nftsResponse = await axios.get(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${tokenId}/nfts${next}`);
    
    const nfts = nftsResponse.data.nfts;

    const wallets = nfts.map(nft => ({ accountId: nft.account_id, serialNumber: nft.serial_number, spender: nft.spender }));

    // Check if there's a next page
    if (nftsResponse.data.links && nftsResponse.data.links.next) {
      // Extract the part after 'nfts?'
      const nextLink = nftsResponse.data.links.next.split('nfts?')[1];
      // Recursively fetch the next page and merge the results
      console.log(nextLink)
      const nextWallets = await getNFTs(`?${nextLink}`);
      return wallets.concat(nextWallets);
    }

    // If there's no next page, just return the wallets
    return wallets;
  } catch (error) {
    console.error('Error fetching NFTs:', error.message);
    return [];
  }
}

const MAX_RETRIES = 5;

async function transferNftWithRetry(serialNumber, retries = 0) {
  try {
    const tokenTransferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, serialNumber, companyId, royaltyWallet)
      .freezeWith(client)
      .sign(companyKey);

    const tokenTransferSubmit = await tokenTransferTx.execute(client);
    const tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

    return tokenTransferRx;
  } catch (error) {
    if (error.toString().includes('TIMEOUT') && retries < MAX_RETRIES) {
      console.warn('Timeout error, retrying...');
      return await transferNftWithRetry(serialNumber, retries + 1);
    } else {
      throw error;
    }
  }
}

async function main() {
  const nfts = await getNFTs();
  const filterNfts = nfts.filter(wallet => (wallet.accountId === companyWallet));

  // Filter out the treasury account ID from holders
  const nftSerialNumberss = filterNfts.map(wallet => `${wallet.serialNumber}`)

  console.log(nftSerialNumberss)

  for (const nftSerialNumber of nftSerialNumberss){
    await transferNftWithRetry(nftSerialNumber)
  }

  //await airdropNFT(nftSerials);

  console.log('Transfer Complete');
}

main()
  .catch(error => console.error('Error in main function:', error));