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

    const wallets = nfts.map(nft => ({ accountId: nft.account_id, serialNumber: nft.serial_number, spender: nft.spender }));

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
  const processedWallets = [];

  for (const wallet of walletsWithNft) {
    const { accountId, serialNumber, spender, action } = wallet;
    const destinationWallet = AccountId.fromString(accountId);
    if (wallet.spender === null)
    {
      try {
        // Transfer the target NFT token from the source wallet to the destination wallet
        // const tokenTransferTx = await new TransferTransaction()
        //   .addNftTransfer(alixonTokenID, serialNumber, treasuryId, destinationWallet) // Assume 1 as the serial number, update as needed
        //   .freezeWith(client)
        //   .sign(treasuryKey)

        // const tokenTransferSubmit = await tokenTransferTx.execute(client);
        // const tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
        wallet.action = 'Sent'
      
        console.log(
          `\n- NFT transfer from Company to ${destinationWallet} with serial number ${serialNumber}: \n` //${tokenTransferRx.status} 
          
        );
        processedWallets.push(wallet);
      } catch (error) {
        wallet.action = 'Unassociated'
        console.error(`Error transferring NFT to wallet ${accountId} with serial number ${serialNumber}:`, error.message);
        processedWallets.push(wallet);
      }
    }
    else {
      wallet.action = 'Listed'
      processedWallets.push(wallet);
    }
  }

  return processedWallets;
}

async function writeTotalsToFile(processedWallets) {
  const totalSent = processedWallets.filter(wallet => wallet.action === 'Sent').length;
  const totalListed = processedWallets.filter(wallet => wallet.action === 'Listed').length;
  const totalUnassociated = processedWallets.filter(wallet => wallet.action === 'Unassociated').length;

  const totals = `Total NFTs Sent: ${totalSent}\nTotal NFTs not sent (Listed): ${totalListed}\nTotal NFTs not sent (Unassociated): ${totalUnassociated}\n`;

  fs.writeFileSync(
    `${fileDir}/totals.txt`,
    totals
  );
}

async function main() {
  const walletsWithNft = await findWalletsHoldingNFT();
  const companyWallet = process.env.COMPANY_WALLET_ID;

  // Filter out the treasury account ID from holders
  const filteredWallets = walletsWithNft.filter(wallet => wallet.accountId !== companyWallet);

  fs.writeFileSync(
    `${fileDir}/accounts_holders.txt`,
    filteredWallets.map(wallet => `${wallet.accountId}|${wallet.serialNumber}|${wallet.spender}`).join('\n')
  );

  const processedWallets = await airdropNFT(filteredWallets);
  fs.writeFileSync(
    `${fileDir}/processed_wallets.txt`,
    processedWallets.map(wallet => `${wallet.accountId}|${wallet.serialNumber}|${wallet.spender}|${wallet.action}`).join('\n')
  );

  await writeTotalsToFile(processedWallets);

  console.log('Airdrop completed. Check processed_wallets.txt');
}

main()
  .catch(error => console.error('Error in main function:', error));
