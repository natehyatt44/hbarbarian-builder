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

const cfpTokenID = process.env.CFP_TOKEN_ID;
const alixonTokenID = process.env.ALIXON_TOKEN_ID;
const mirrorNodeApiBaseUrl = 'https://mainnet-public.mirrornode.hedera.com';
const companyWallet = process.env.COMPANY_WALLET_ID;

async function findWalletsHoldingNFT(next = '') {

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

async function doesCompanyOwnNft(serialNumber) {
  const nftsResponse = await axios.get(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${alixonTokenID}/nfts/${serialNumber}`);
  console.log(nftsResponse.data.account_id)
  console.log(companyWallet)
  console.log(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${alixonTokenID}/nfts/${serialNumber}`)
  if (nftsResponse.data.account_id === companyWallet) {return true}
  else {return false}
}

const MAX_RETRIES = 5;

async function transferNftWithRetry(alixonTokenID, serialNumber, companyId, destinationWallet, retries = 0) {
  try {
    const tokenTransferTx = await new TransferTransaction()
      .addNftTransfer(alixonTokenID, serialNumber, companyId, destinationWallet)
      .freezeWith(client)
      .sign(companyKey);

    const tokenTransferSubmit = await tokenTransferTx.execute(client);
    const tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

    return tokenTransferRx;
  } catch (error) {
    if (error.toString().includes('TIMEOUT') && retries < MAX_RETRIES) {
      console.warn('Timeout error, retrying...');
      return await transferNftWithRetry(alixonTokenID, serialNumber, companyId, destinationWallet, retries + 1);
    } else {
      throw error;
    }
  }
}

async function airdropNFT(walletsWithNft) {
  const processedWallets = [];

  for (const wallet of walletsWithNft) {
    const { accountId, serialNumber, spender } = wallet;
    const destinationWallet = AccountId.fromString(accountId);

    if (wallet.spender === null) {
      // Check if the company owns the NFT before initiating the transfer
      if (await doesCompanyOwnNft(wallet.serialNumber)) {
        try {
          // Transfer the target NFT token from the source wallet to the destination wallet
          const tokenTransferRx = await transferNftWithRetry(alixonTokenID, serialNumber, companyId, destinationWallet);
          
          wallet.action = 'Sent';

          console.log(
            `\n- NFT transfer from Company to ${destinationWallet} with serial number ${serialNumber}: \n ${tokenTransferRx.status}`
          );
          processedWallets.push(wallet);
        } catch (error) {
          wallet.action = 'Unassociated'
          console.error(`Error transferring NFT to wallet ${accountId} with serial number ${serialNumber}:`, error.message);
          processedWallets.push(wallet);
        }
      } else {
        console.log(`The company does not own the NFT with serial number ${serialNumber}. Skipping...`);
        wallet.action = 'Unowned';
        processedWallets.push(wallet);
      }
    } else {
      wallet.action = 'Listed';
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

  // Filter out the treasury account ID from holders
  const filteredWallets = walletsWithNft.filter(wallet => (wallet.accountId !== companyWallet && wallet.serialNumber > 702 && wallet.serialNumber <= 707));

  fs.writeFileSync(
    `${fileDir}/accounts_holdersDropCheck.txt`,
    filteredWallets.map(wallet => `${wallet.accountId}|${wallet.serialNumber}|${wallet.spender}`).join('\n')
  );

  let accountHoldersText = fs.readFileSync('utils/files/accounts_holdersDropCheck.txt', 'utf8');

  // split the content by new line
  let lines = accountHoldersText.split('\n');

  let accountHolders = lines.map(line => {
    // split each line by '|', and remove any leading or trailing spaces on each item
    let [accountId, serialNumber, spender] = line.split('|').map(item => item.trim());

    // return an object with the same structure as filteredWallets
    return {
      accountId,
      serialNumber: Number(serialNumber),
      spender: spender === 'null' ? null : spender
    };
  });

  const processedWallets = await airdropNFT(accountHolders);
  fs.writeFileSync(
    `${fileDir}/processed_wallets.txt`,
    processedWallets.map(wallet => `${wallet.accountId}|${wallet.serialNumber}|${wallet.spender}|${wallet.action}`).join('\n')
  );

  await writeTotalsToFile(processedWallets);

  console.log('Airdrop completed. Check processed_wallets.txt');
}

main()
  .catch(error => console.error('Error in main function:', error));

  // 0.0.2189925 fail_invalid