const { Client, AccountBalanceQuery} = require("@hashgraph/sdk");
require("dotenv").config();

const accountBalance = async() => {
    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // If we weren't able to grab it, we should throw a new error
    if (myAccountId == null ||
        myPrivateKey == null) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }

    // Create our connection to the Hedera network
    // The Hedera JS SDK makes this really easy!
    const client = Client.forTestnet();

    client.setOperator(myAccountId, myPrivateKey);

    //Verify the account balance
    try{
        return new Promise(async (resolve) => {
            const accountBalance = await new AccountBalanceQuery()
                .setAccountId(myAccountId)
                .execute(client);
            resolve(console.log("Your Account balance is: " + accountBalance.hbars._valueInTinybar + " tinybar."));
        })
    } catch (error) {console.log("dead")}

    console.log("Your Account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");

}

module.exports = {accountBalance}