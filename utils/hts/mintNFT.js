console.clear();
require("dotenv").config();
const basePath = process.cwd();
const fs = require("fs");
const {
	AccountId,
	PrivateKey,
	Client,
	TokenCreateTransaction,
	TokenInfoQuery,
	TokenType,
	CustomRoyaltyFee,
	CustomFixedFee,
	Hbar,
	TokenSupplyType,
	TokenMintTransaction,
	AccountBalanceQuery,
} = require("@hashgraph/sdk");
const buildPath = 'buildAlixon'

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
const operatorKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);
const treasuryId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
const treasuryKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);
const payrollId = AccountId.fromString(process.env.ALIXON_WALLET_ID);

const client = Client.forMainnet().setOperator(operatorId, operatorKey);
// Max transaction fee as a constant
const maxTransactionFee = new Hbar(5000);
// 4800 hbar to start, 262 usd
// 3300 hbar, 175 usd

supply_private_string = '6C2CF556E15821C71FC7690301F686B6D39FC112826EE55A9BE319A32A270D17'
//supply_public_string = '49DB4F4F95555F752A7A13E4FE6102698C9F9777DEB96F39B989BA9C37244EF0'

//const supplyKey = PrivateKey.generate();
const supplyKey = PrivateKey.fromStringED25519(supply_private_string);
//const adminKey = PrivateKey.generate();
// const pauseKey = PrivateKey.generate();
// const freezeKey = PrivateKey.generate();
// const wipeKey = PrivateKey.generate();

async function main() {
	//IPFS content identifiers for which we will create a NFT
	let rawCID = fs.readFileSync(`${basePath}/${buildPath}/ipfsMetas/_CID.json`)
	let CID = JSON.parse(rawCID);

	// DEFINE CUSTOM FEE SCHEDULE
	// let nftCustomFee = await new CustomRoyaltyFee()
	// 	.setNumerator(22)
	// 	.setDenominator(250)
	// 	.setFeeCollectorAccountId(payrollId)

	// // CREATE NFT WITH CUSTOM FEE
    // let nftCreate = await new TokenCreateTransaction()
    //     .setTokenName("Hbarbarians - The Alixon Collection 1/1s")
    //     .setTokenSymbol("Hbarbarians - The Alixon Collection 1/1s")
    //     .setTokenType(TokenType.NonFungibleUnique)
    //     .setDecimals(0)
    //     .setInitialSupply(0)
    //     .setTreasuryAccountId(treasuryId)
    //     .setSupplyType(TokenSupplyType.Finite)
    //     .setMaxSupply(CID.length)
    //     .setCustomFees([nftCustomFee])
	// 	.setMaxTransactionFee(maxTransactionFee)
    //     // .setAdminKey(adminKey)
    //     .setSupplyKey(supplyKey)
    //     // .setPauseKey(pauseKey)
    //     // .setFreezeKey(freezeKey)
    //     // .setWipeKey(wipeKey)
    //     .freezeWith(client)
    //     .sign(treasuryKey);

    // let nftCreateTxSign = await nftCreate.sign(adminKey);
    // let nftCreateSubmit = await nftCreateTxSign.execute(client);
    // let nftCreateRx = await nftCreateSubmit.getReceipt(client);
    // let tokenId = nftCreateRx.tokenId;
    // console.log(`Created NFT with Token ID: ${tokenId} \n`);

	// TOKEN QUERY TO CHECK THAT THE CUSTOM FEE SCHEDULE IS ASSOCIATED WITH NFT
    // var tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);
    // console.table(tokenInfo.customFees[0]);
	// MINT NEW BATCH OF NFTs

	const tokenId = '0.0.2371643'
	nftLeaf = [];
	for (var i = 0; i < CID.length; i++) {
		nftLeaf[i] = await tokenMinterFcn(CID[i]);
		console.log(`Created NFT ${tokenId} with serial: ${nftLeaf[i].serials[0].low}`);
	}

	// BALANCE CHECK 1
	//oB = await bCheckerFcn(treasuryId);
	//console.log(`- Treasury balance: ${oB[0]} NFTs of ID:${tokenId} and ${oB[1]}`);

	// TOKEN MINTER FUNCTION ==========================================
	async function tokenMinterFcn(CID) {
		let maxRetries = 5;  // Set your max retry limit
		let retries = 0;

		while(retries < maxRetries) {
			try {
				let mintTx = await new TokenMintTransaction()
					.setTokenId(tokenId)
					.setMetadata([Buffer.from(CID)])
					.setMaxTransactionFee(maxTransactionFee)
					.freezeWith(client);

				let mintTxSign = await mintTx.sign(supplyKey);
				let mintTxSubmit = await mintTxSign.execute(client);
				let mintRx = await mintTxSubmit.getReceipt(client);

				// If we reach this point without throwing an error, we can return the receipt
				return mintRx;
			} catch (error) {
				console.error(`Attempt ${retries + 1} failed with error: ${error.message}`);
				retries++;

				// If we've hit the max retries, throw the error
				if (retries === maxRetries) {
					throw new Error(`Failed to mint token after ${maxRetries} attempts`);
				}
			}
		}
	}


	// BALANCE CHECKER FUNCTION ==========================================
	async function bCheckerFcn(id) {
		balanceCheckTx = await new AccountBalanceQuery().setAccountId(id).execute(client);
		return [balanceCheckTx.tokens._map.get(tokenId.toString()), balanceCheckTx.hbars];
	}
}
main();