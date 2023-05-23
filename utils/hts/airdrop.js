const axios = require('axios');
require("dotenv").config();
const fs = require('fs');
const basePath = process.cwd();
const fileDir = `${basePath}/utils/files`;
const { TransferTransaction, PrivateKey, AccountId, Client } = require('@hashgraph/sdk');

// Configure the Hedera Client
// const companyId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
// const companyKey = PrivateKey.fromString(process.env.COMPANY_WALLET_KEY);

// const client = Client.forTestnet().setOperator(companyId, companyKey);

const cfpTokenID = process.env.CFP_TOKEN_ID;
const alixonTokenID = process.env.ALIXON_TOKEN_ID;

async function findWalletsHoldingNFT(next = '') {
  const mirrorNodeApiBaseUrl = 'https://mainnet-public.mirrornode.hedera.com';

  try {
    console.log(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${cfpTokenID}/nfts${next}`)
    const nftsResponse = await axios.get(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${cfpTokenID}/nfts${next}`);
    
    
    const nfts = nftsResponse.data.nfts;
    const wallets = nfts.map(nft => ({ accountId: nft.account_id, serialNumber: nft.serial_number }));

    // Check if there's a next page
    if (nftsResponse.data.links && nftsResponse.data.links.next) {
      // Extract the part after 'nfts?'
      const nextLink = nftsResponse.data.links.next.split('nfts?')[1];
      // Recursively fetch the next page and merge the results
      console.log(nextLink)
      const nextWallets = await findWalletsHoldingNFT(`?${nextLink}`);
      return wallets.concat(nextWallets);
    }

    // If there's no next page, just return the wallets
    return wallets;
  } catch (error) {
    console.error('Error fetching NFTs:', error.message);
    return [];
  }
}



async function airdropNFT(walletsWithNft) {
  const failedWallets = [];

  for (const wallet of walletsWithNft) {
    const { accountId, serialNumber } = wallet;
    const destinationWallet = AccountId.fromString(accountId);

    try {
      // Transfer the target NFT token from the source wallet to the destination wallet
      const tokenTransferTx = await new TransferTransaction()
        .addNftTransfer(alixonTokenID, serialNumber, treasuryId, destinationWallet) // Assume 1 as the serial number, update as needed
        .freezeWith(client)
        .sign(treasuryKey)

      const tokenTransferSubmit = await tokenTransferTx.execute(client);
      const tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
    
      console.log(
        `\n- NFT transfer from Treasury to ${destinationWallet} with serial number ${serialNumber}: ${tokenTransferRx.status} \n`
      );
      
    } catch (error) {
      console.error(`Error transferring NFT to wallet ${accountId} with serial number ${serialNumber}:`, error.message);
      failedWallets.push(wallet);
    }
  }

  return failedWallets;
}

async function main() {
  const walletsWithNft = await findWalletsHoldingNFT();
  const companyWallet = process.env.COMPANY_WALLET_ID;

  // Filter out the treasury account ID from holders
  const filteredWallets = walletsWithNft.filter(wallet => wallet.accountId !== companyWallet);

  fs.writeFileSync(
    `${fileDir}/accounts_holders.txt`,
    filteredWallets.map(wallet => `${wallet.accountId},${wallet.serialNumber}`).join('\n')
  );

  // const failedWallets = await airdropNFT(filteredWallets);
  // fs.writeFileSync(
  //   `${fileDir}/failed_wallets.txt`,
  //   failedWallets.map(wallet => `${wallet.accountId},${wallet.serialNumber}`).join('\n')
  // );

  // console.log('Airdrop completed. Check failed_wallets.txt for wallets that failed to receive the NFT.');
}

main()
  .catch(error => console.error('Error in main function:', error));
