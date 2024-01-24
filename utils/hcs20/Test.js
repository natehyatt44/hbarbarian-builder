const { Client, TopicMessageSubmitTransaction, AccountId, PrivateKey } = require("@hashgraph/sdk");
const fs = require("fs");
require("dotenv").config();

async function submitMessageToHedera() {
    // Configure accounts and client, and generate needed keys
    const companyId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
    const companyKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);
    const client = Client.forMainnet().setOperator(companyId, companyKey);
    const topicId = "0.0.4350190"; // The topic ID to submit the message to

   // Define the starting account ID
   const startAtAccountId = "0.0.710168";
   let startProcessing = false;

   // Read JSON file
   const fileContent = fs.readFileSync("utils/hcs20/cfpHolders.json");
   const holders = JSON.parse(fileContent).owners;

    for (const holder of holders) {
      if (holder.account === startAtAccountId || startProcessing) {
        startProcessing = true; 
        // Construct mint message for each holder
        const mintMessage = {
            "p": "hcs-20",
            "op": "mint",
            "tick": "BarbarianINK",
            "amt": holder.balance.toString(), // Balance from JSON file
            "to": holder.account, // Account from JSON file
            "m": "BarbarianINK HCS-20 Zombie Edition! LFG"
        };

        console.log(mintMessage)

        //Retry configuration
        const maxRetries = 10;
        let currentRetry = 0;

        while (currentRetry < maxRetries) {
            try {
                // Create a new topic message submit transaction
                const messageSubmitTx = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setMessage(JSON.stringify(mintMessage));

                // Execute the transaction
                const submitTxResponse = await messageSubmitTx.execute(client);

                // Request the receipt of the transaction
                const receipt = await submitTxResponse.getReceipt(client);

                console.log(`Message for account ${holder.account} submitted successfully. Status: ${receipt.status}`);
                break; // Exit the retry loop on success
            } catch (error) {
                console.error("Attempt", currentRetry + 1, "Error submitting to Hedera:", error);
                currentRetry++;
                if (currentRetry >= maxRetries) {
                    console.error("Max retries reached for account", holder.account);
                    break;
                }
                console.log("Retrying transaction for account", holder.account);
            }
        }
      } else {
        console.log(`Skipping account ${holder.account}`);
    }
      }
}

submitMessageToHedera();


// The JSON message you want to submit
    // Deploy
    // const deployMessage = {
    //   "p": "hcs-20",
    //   "op": "deploy",
    //   "name": "BarbarianINK",
    //   "tick": "BarbarianINK",
    //   "max": "1000",
    //   "metadata": "ipfs://bafkreibksfbxq5qeyly2kma4aw5d4oyyjhlr5izzvoog2sl36kmqudxjw4",
    //   "m": "BarbarianINK HCS-20 Zombie Edition! LFG"
    // };
