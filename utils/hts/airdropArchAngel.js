const axios = require('axios');
require("dotenv").config();
const fs = require('fs');
const { TransferTransaction, PrivateKey, AccountId, Client } = require('@hashgraph/sdk');

const companyId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
const companyKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);
const client = Client.forMainnet().setOperator(companyId, companyKey);

const cfpTokenID = process.env.CFP_TOKEN_ID; // For Zombie NFTs
const lostonesTokenID = process.env.LOSTONES_TOKEN_ID; // For Lost One NFTs

const zombieSerials =[
  501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, // spirits
  20, 27, 56, 58, 141, 175, 209, 210, 217, 228, 335, 342, 409, 411, 421, 428, 442, // zombies
  553, 998 // 1/1s
];
const lostOneSerials = []; // Serials 501-539 for Lost One NFTs

const mirrorNodeApiBaseUrl = 'https://mainnet-public.mirrornode.hedera.com';

// Find wallets holding Zombie NFTs
async function findWalletsHoldingZombieNFTs() {
  let accountNftCounts = {};
  try {
    for (let serial of zombieSerials) {
      const nftsResponse = await axios.get(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${cfpTokenID}/nfts/${serial}`);
      let accountId = nftsResponse.data.account_id;
      if (accountId && accountId == '0.0.1067445') {
        accountNftCounts[accountId] = (accountNftCounts[accountId] || 0) + 1;
      }
    }
    return accountNftCounts;
  } catch (error) {
    console.error('Error fetching Zombie NFTs:', error.message);
    return {};
  }
}

const MAX_RETRIES = 5;

// Transfer NFT with retry
async function transferNftWithRetry(tokenID, serialNumber, companyId, destinationWallet, retries = 0) {
  try {
    const tokenTransferTx = await new TransferTransaction()
      .addNftTransfer(tokenID, serialNumber, companyId, destinationWallet)
      .freezeWith(client)
      .sign(companyKey);

    const tokenTransferSubmit = await tokenTransferTx.execute(client);
    const tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

    return tokenTransferRx;
  } catch (error) {
    if (error.toString().includes('TIMEOUT') && retries < MAX_RETRIES) {
      console.warn('Timeout error, retrying...');
      return await transferNftWithRetry(tokenID, serialNumber, companyId, destinationWallet, retries + 1);
    } else {
      throw error;
    }
  }
}

// Distribute Lost One NFTs to holders of Zombie NFTs
async function airdropLostOneNFTs(walletsHoldingZombieNFTs) {
  let processedWallets = [];
  let lostOneSerialIndex = 0;

  for (const [accountId, nftCount] of Object.entries(walletsHoldingZombieNFTs)) {
    for (let i = 0; i < nftCount; i++) {
      if (lostOneSerialIndex >= lostOneSerials.length) {
        console.warn('Ran out of Lost One NFTs to distribute');
        break; // Stop if we run out of Lost One NFTs
      }

      try {
        const destinationWallet = AccountId.fromString(accountId);
        const tokenTransferRx = await transferNftWithRetry(lostonesTokenID, lostOneSerials[lostOneSerialIndex], companyId, destinationWallet);
        processedWallets.push({ accountId, serialNumber: lostOneSerials[lostOneSerialIndex], action: 'Sent' });
        console.log(`NFT transfer from Company to ${destinationWallet} with serial number ${lostOneSerials[lostOneSerialIndex]}: ${tokenTransferRx.status}`);
        lostOneSerialIndex++;
      } catch (error) {
        console.error(`Error transferring NFT to wallet ${accountId}:`, error.message);
        processedWallets.push({ accountId, serialNumber: lostOneSerials[lostOneSerialIndex], action: 'Failed' });
        lostOneSerialIndex++; // Increment even on failure to avoid retrying the same serial
      }
    }
  }

  return processedWallets;
}

// The rest of the functions remain the same

async function main() {
  const walletsHoldingZombieNFTs = await findWalletsHoldingZombieNFTs();
  const processedWallets = await airdropLostOneNFTs(walletsHoldingZombieNFTs);
  // Additional code to handle file writing and logging
  // ...
}

main().catch(error => console.error('Error in main function:', error));
