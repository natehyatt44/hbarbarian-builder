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
const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const treasuryId = AccountId.fromString(process.env.HASHPACK_ID);
const treasuryKey = PrivateKey.fromString(process.env.HASHPACK_PRIVATE_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
const pauseKey = PrivateKey.generate();
const freezeKey = PrivateKey.generate();
const wipeKey = PrivateKey.generate();

async function main() {
	//IPFS content identifiers for which we will create a NFT
	let rawCID = fs.readFileSync(`${basePath}/${buildPath}/ipfsMetas/_CID.json`)
	let CID = JSON.parse(rawCID);

	// DEFINE CUSTOM FEE SCHEDULE
	let nftCustomFee = await new CustomRoyaltyFee()
		.setNumerator(7)
		.setDenominator(100)
		.setFeeCollectorAccountId(treasuryId)
		.setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(11)));

	// CREATE NFT WITH CUSTOM FEE
    let nftCreate = await new TokenCreateTransaction()
        .setTokenName("BarbarianInc - The Alixon Collection")
        .setTokenSymbol("ALX")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(CID.length)
        .setCustomFees([nftCustomFee])
        // .setAdminKey(adminKey)
        .setSupplyKey(supplyKey)
        // .setPauseKey(pauseKey)
        // .setFreezeKey(freezeKey)
        // .setWipeKey(wipeKey)
        .freezeWith(client)
        .sign(treasuryKey);

    let nftCreateTxSign = await nftCreate.sign(adminKey);
    let nftCreateSubmit = await nftCreateTxSign.execute(client);
    let nftCreateRx = await nftCreateSubmit.getReceipt(client);
    let tokenId = nftCreateRx.tokenId;
    console.log(`Created NFT with Token ID: ${tokenId} \n`);

	// TOKEN QUERY TO CHECK THAT THE CUSTOM FEE SCHEDULE IS ASSOCIATED WITH NFT
    var tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);
    console.table(tokenInfo.customFees[0]);
	
	// MINT NEW BATCH OF NFTs
	nftLeaf = [];
	for (var i = 0; i < CID.length; i++) {
		nftLeaf[i] = await tokenMinterFcn(CID[i]);
		console.log(`Created NFT ${tokenId} with serial: ${nftLeaf[i].serials[0].low}`);
	}

	// BALANCE CHECK 1
	oB = await bCheckerFcn(treasuryId);
	console.log(`- Treasury balance: ${oB[0]} NFTs of ID:${tokenId} and ${oB[1]}`);

	// TOKEN MINTER FUNCTION ==========================================
	async function tokenMinterFcn(CID) {
		mintTx = await new TokenMintTransaction()
			.setTokenId(tokenId)
			.setMetadata([Buffer.from(CID)])
			.freezeWith(client);
		let mintTxSign = await mintTx.sign(supplyKey);
		let mintTxSubmit = await mintTxSign.execute(client);
		let mintRx = await mintTxSubmit.getReceipt(client);
		return mintRx;
	}

	// BALANCE CHECKER FUNCTION ==========================================
	async function bCheckerFcn(id) {
		balanceCheckTx = await new AccountBalanceQuery().setAccountId(id).execute(client);
		return [balanceCheckTx.tokens._map.get(tokenId.toString()), balanceCheckTx.hbars];
	}
}
main();