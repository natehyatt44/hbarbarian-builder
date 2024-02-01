const {
  Client,
  PrivateKey,
  Hbar,
  TransferTransaction,
  AccountId,
} = require("@hashgraph/sdk");
require("dotenv").config();
const readlineSync = require('readline-sync');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configure accounts and client, and generate needed keys
const companyId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
const companyKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);
const client = Client.forMainnet().setOperator(companyId, companyKey);

const cfpTokenID = process.env.CFP_TOKEN_ID;
const lostOnesTokenID = "0.0.3721853";
const zombieSerials = [
                        501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, // spirits
                        20, 27, 56, 58, 141, 175, 209, 210, 217, 228, 335, 342, 409, 411, 421, 428, 442, // zombies
                        553, 998 // 1/1s
                      ];
const lostOnesSerials = [924, 937]
const mirrorNodeApiBaseUrl = 'https://mainnet-public.mirrornode.hedera.com';

async function main() {
  let mintPayOut = 3416666666;
  // 3416666666 was first mint payout
  // 20, 500, 000, 000 in total over 6 months


  // Get wallets holding the NFTs and the count of NFTs they hold
  let accountNftCounts = await findWalletsHoldingNFT();

  let totalNfts = Object.values(accountNftCounts).reduce((sum, count) => sum + count, 0);
  let sharePerNft = Number(mintPayOut / totalNfts).toFixed(4);

  console.log(`Total DICK AIRDROP: ${mintPayOut} DICK`)
  console.log(`Each Zombie/Spirit NFT will receive: ${sharePerNft} DICK`);
  console.log(``);

  // Calculate and print distribution for each account
  let distribution = [];
    Object.entries(accountNftCounts).forEach(([accountId, count]) => {
        let totalShare = Number(sharePerNft * count).toFixed(4); // Format to 2 decimal places
        console.log(`Account ID ${accountId} will receive: ${totalShare} HBAR`);
        distribution.push({ accountId, totalShare: parseFloat(totalShare) }); // Convert back to number for transaction
    });

  // Write distribution to CSV
  writeDistributionToCSV(distribution);

  // Prompt for confirmation before executing the transaction
  const confirm = readlineSync.question(`Do you want to proceed with the transaction? (y/n): `);
  if (confirm === 'y') {
    await distributePayments(distribution, mintPayOut / distribution.length);
  } else {
    console.log(`Transaction cancelled by user`);
  }
}


async function findWalletsHoldingNFT() {
  try {
      let accountNftCounts = {};

      for (let serial of lostOnesSerials) {
        const nftsResponse = await axios.get(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${lostOnesTokenID}/nfts/${serial}`);
        let accountId = nftsResponse.data.account_id;
        if (accountId) {
            accountNftCounts[accountId] = (accountNftCounts[accountId] || 0) + 1;
        }
      }

      for (let serial of zombieSerials) {
          const nftsResponse = await axios.get(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${cfpTokenID}/nfts/${serial}`);
          let accountId = nftsResponse.data.account_id;
          if (accountId) {
              accountNftCounts[accountId] = (accountNftCounts[accountId] || 0) + 1;
          }
      }
      return accountNftCounts;
  } catch (error) {
      console.error('Error fetching NFTs:', error.message);
      return {};
  }
}

async function executeTransactionWithRetry(transaction, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transactionResponse = await transaction.execute(client);
      return await transactionResponse.getReceipt(client);
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error}`);
      lastError = error;
      // Wait for a short period before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError; // If all retries fail, throw the last encountered error
}

function writeDistributionToCSV(distribution) {
  const csvFilePath = path.join(__dirname, 'distribution.csv');
  let csvContent = 'Account ID,Total Share\n';

  distribution.forEach(({ accountId, totalShare }) => {
    csvContent += `${accountId},${totalShare}\n`;
  });

  fs.writeFile(csvFilePath, csvContent, (err) => {
    if (err) {
      console.error('Error writing CSV file:', err);
    } else {
      console.log(`Distribution CSV file created at ${csvFilePath}`);
    }
  });
}

async function distributePayments(distribution, mintPayOut) {
  for (const { accountId, totalShare } of distribution) {
    const transaction = new TransferTransaction()
      .addTokenTransfer("0.0.781589", accountId, totalShare)
      .addTokenTransfer("0.0.781589", companyId, -totalShare)
      .setTransactionMemo("BarbarianINK BIG DICK Airdrop") ;

    try {
      // Execute the transaction with retry mechanism
      const transactionReceipt = await executeTransactionWithRetry(transaction);
      console.log(`Transaction for Account ID ${accountId}: ` + transactionReceipt.status.toString());
    } catch (error) {
      console.error(`Final attempt failed for Account ID ${accountId}: ${error}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
});
