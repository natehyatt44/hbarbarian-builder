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
const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const treasuryKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const aliceId = AccountId.fromString(process.env.HASHPACK_ID);
// const aliceKey = PrivateKey.fromString(process.env.ALICE_PVKEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();

async function main() {
    //Create the NFT
    let nftCreate = await new TokenCreateTransaction()
        .setTokenName("Test MFers Collection")
        .setTokenSymbol("TMferst")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(2000)
        .setSupplyKey(supplyKey)
        .freezeWith(client);

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
    cids = ["bafkreih4ltphnu2zgsj75tjqmqke2cagggo326zitgh6xbuz3s7qautrfe",
            "bafkreibrm4kpir4qhcnmhiszzlmk3tgrwtl7xaemt4tvkvwxlh56ahnqam",
            "bafkreicb3qa6wr2frd6bhlqqaifm7vtcrfbfazmvgku6mva6bba2wsdheu"
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
    console.log(`- Created NFT ${tokenId} with serial: ${mintRx.serials[0].low} \n`);
}
main();