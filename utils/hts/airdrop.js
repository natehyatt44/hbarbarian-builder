const axios = require('axios');
require("dotenv").config();
const fs = require('fs');
const basePath = process.cwd();
const fileDir = `${basePath}/utils/files`;
const { TransferTransaction, PrivateKey, AccountId, Client } = require('@hashgraph/sdk');

// Configure the Hedera Client
const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const treasuryId = AccountId.fromString(process.env.HASHPACK_ID);
const treasuryKey = PrivateKey.fromString(process.env.HASHPACK_PRIVATE_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const cfpTokenID = '0.0.4198857';
const alixonTokenID = '0.0.4198664';

async function findWalletsHoldingNFT() {
  const mirrorNodeApiBaseUrl = 'https://testnet.mirrornode.hedera.com';

  try {
    const nftsResponse = await axios.get(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${cfpTokenID}/nfts`);

    const nfts = nftsResponse.data.nfts;

    return nfts.map(nft => ({ accountId: nft.account_id, serialNumber: nft.serial_number }));
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
  const companyWallet = '0.0.18346';

  // Filter out the treasury account ID from holders
  const filteredWallets = walletsWithNft.filter(wallet => wallet.accountId !== companyWallet);

  fs.writeFileSync(
    `${fileDir}/accounts_holders.txt`,
    filteredWallets.map(wallet => `${wallet.accountId},${wallet.serialNumber}`).join('\n')
  );

  const failedWallets = await airdropNFT(filteredWallets);
  fs.writeFileSync(
    `${fileDir}/failed_wallets.txt`,
    failedWallets.map(wallet => `${wallet.accountId},${wallet.serialNumber}`).join('\n')
  );

  console.log('Airdrop completed. Check failed_wallets.txt for wallets that failed to receive the NFT.');
}

main()
  .catch(error => console.error('Error in main function:', error));
