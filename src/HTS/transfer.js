const { Client, AccountBalanceQuery, TransferTransaction, Hbar } = require("@hashgraph/sdk");
require("dotenv").config();

async function main() {

    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // If we weren't able to grab it, we should throw a new error
    if (myAccountId == null ||
        myPrivateKey == null ) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }

// Create our connection to the Hedera network
// The Hedera JS SDK makes this really easy!
    const client = Client.forTestnet();

    client.setOperator(myAccountId, myPrivateKey);

    const newAccountId = "0.0.48575754";

    //console.log("The new account balance is: " +accountBalance.hbars.toTinybars() +" tinybar.");
    //-----------------------<enter code below>--------------------------------------

    //Create the transfer transaction
    const sendHbar = await new TransferTransaction()
        .addHbarTransfer(myAccountId, Hbar.fromTinybars(-1000)) //Sending account
        .addHbarTransfer(newAccountId, Hbar.fromTinybars(1000)) //Receiving account
        .execute(client);

    const transactionReceipt = await sendHbar.getReceipt(client);
    console.log(`Status of txn: ${transactionReceipt.status}`)

    const getNewBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log(`New balance: ${getNewBalance.hbars._valueInTinybar}`)




    console.log('wgmi')
    client.close();
}
main();