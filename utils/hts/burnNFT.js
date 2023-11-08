console.clear();
require("dotenv").config();
const basePath = process.cwd();
const axios = require('axios');
const fs = require("fs");
const {
	AccountId,
	PrivateKey,
	Client,
	TokenCreateTransaction,
    TokenBurnTransaction,
	TokenInfoQuery,
	TokenType,
	CustomRoyaltyFee,
	CustomFixedFee,
	Hbar,
} = require("@hashgraph/sdk");

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
const operatorKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);
const treasuryId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
const treasuryKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);

const client = Client.forMainnet().setOperator(operatorId, operatorKey);
// Max transaction fee as a constant
const maxTransactionFee = new Hbar(5000);

supply_private_string = '6C2CF556E15821C71FC7690301F686B6D39FC112826EE55A9BE319A32A270D17'
//supply_public_string = '49DB4F4F95555F752A7A13E4FE6102698C9F9777DEB96F39B989BA9C37244EF0'

const supplyKey = PrivateKey.fromStringED25519(supply_private_string);

const cfpTokenID = process.env.CFP_TOKEN_ID;
const alixonTokenID = process.env.ALIXON_TOKEN_ID;
const mirrorNodeApiBaseUrl = 'https://mainnet-public.mirrornode.hedera.com';
const companyWallet = process.env.COMPANY_WALLET_ID;

async function findWalletsHoldingNFT(next = '') {

    try {
      console.log(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${alixonTokenID}/nfts${next}`)
      const nftsResponse = await axios.get(`${mirrorNodeApiBaseUrl}/api/v1/tokens/${alixonTokenID}/nfts${next}`);
      
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

async function main() {
    const walletsWithNft = await findWalletsHoldingNFT();

    const filteredWallets = walletsWithNft.filter(wallet => (wallet.accountId === companyWallet && wallet.serialNumber >= 1));

    let serialList = filteredWallets.map(wallet => wallet.serialNumber.toString());

    console.log(serialList)

    for (let i = 0; i < serialList.length; i += 5) {
    let serialsToBurn = serialList.slice(i, i + 5);
    
    let transaction = await new TokenBurnTransaction()
        .setTokenId(process.env.ALIXON_TOKEN_ID)
        .setSerials(serialsToBurn)
        .freezeWith(client);
        
    //Sign with the supply private key of the token 
    const signTx = await transaction.sign(supplyKey);
    
    //Submit the transaction to a Hedera network    
    const txResponse = await signTx.execute(client);
    
    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);
        
    //Get the transaction consensus status
    const transactionStatus = receipt.status;
    
    console.log("The transaction consensus status " +transactionStatus.toString());
    }



}
main();