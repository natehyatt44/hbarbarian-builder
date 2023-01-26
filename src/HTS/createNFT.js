console.clear();
require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    TransferTransaction,
    AccountBalanceQuery,
    TokenAssociateTransaction
} = require("@hashgraph/sdk");

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString('0.0.28536695');
const operatorKey = PrivateKey.fromString('34619a795393b6e170e923d6297f53d5afac262c1b287fff32ad376efe6ccb48');
const treasuryId = AccountId.fromString('0.0.49347654');
const treasuryKey = PrivateKey.fromStringED25519('302e020100300506032b6570042204201dc85aadc73ba35c55c6390e218019894666c9f3001c2cebe60cd65a997d0db2');

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
const pauseKey = PrivateKey.generate();
const freezeKey = PrivateKey.generate();
const wipeKey = PrivateKey.generate();

async function main() {
   // DEFINE CUSTOM FEE SCHEDULE
    // let nftCustomFee = await new CustomRoyaltyFee()
    //     .setNumerator(5)
    //     .setDenominator(10)
    //     .setFeeCollectorAccountId(treasuryId)
    //     .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));

    //Create the NFT
    let nftCreate = await new TokenCreateTransaction()
        .setTokenName("Test Friend People")
        .setTokenSymbol("TFP")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(2000)
        //.setCustomFees([nftCustomFee])
        .setAdminKey(adminKey)
        .setSupplyKey(supplyKey)
        // .setPauseKey(pauseKey)
        .setFreezeKey(freezeKey)
        .setWipeKey(wipeKey)
        .freezeWith(client)
        .sign(treasuryKey);

    //Sign the transaction with the treasury key
    let nftCreateTxSign = await nftCreate.sign(treasuryKey);

    //Submit the transaction to a Hedera network
    let nftCreateSubmit = await nftCreateTxSign.execute(client);

    //Get the transaction receipt
    let nftCreateRx = await nftCreateSubmit.getReceipt(client);

    //Get the token ID
    let tokenId = nftCreateRx.tokenId;

    //Log the token ID
    console.log(`- Created NFT with Token ID: ${tokenId} \n`);

    //IPFS content identifiers for which we will create a NFT
    cids = ["bafkreif65xl5iq4urlawll4xzx3aiywqqoblmdldeuehdkhu5qivvqhvla",
            "bafkreidkonikq3y56s4hnjd3n47hv7rkkq5zb7fbnvmxb3fkbu4324r5qm",
            "bafkreigkqenqgqliaffdcm77os6tksi66dkmel5vptrpuzo36dnlilmdqy"
           ];

    const meta = cids.map((cid) => Buffer.from(`ipfs://${ cid }`));

    // Mint new NFT
    let mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata(meta)
        .freezeWith(client);

    //Sign the transaction with the supply key
    let mintTxSign = await mintTx.sign(supplyKey);

    //Submit the transaction to a Hedera network
    let mintTxSubmit = await mintTxSign.execute(client);

    //Get the transaction receipt
    let mintRx = await mintTxSubmit.getReceipt(client);

    //Log the serial number
    console.log(`- Created NFT ${tokenId} with serial: ${mintRx.serials[0].low}  \n`);
}
main();