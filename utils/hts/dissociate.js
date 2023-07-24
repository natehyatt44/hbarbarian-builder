const {
    Client,
    PrivateKey,
    AccountId,
    TokenDissociateTransaction,
  } = require("@hashgraph/sdk");
  require("dotenv").config();
  const readlineSync = require('readline-sync');
  
  // Configure accounts and client, and generate needed keys
  const operatorId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
  const operatorKey = PrivateKey.fromString(process.env.COMPANY_PRIVATE_KEY);

  const client = Client.forMainnet().setOperator(operatorId, operatorKey);
  
  async function main() {
    
    const tokenDissociateTransaction = new TokenDissociateTransaction()
      .setAccountId(operatorId)
      .setTokenIds(['0.0.2361217']);  // Assuming '0.0.2361217' is your token ID, store it in .env file

    const transactionResponse = await tokenDissociateTransaction.execute(client);

    const receipt = await transactionResponse.getReceipt(client);

    console.log(`Status: ${receipt.status}`);
  
  }
  
  
  main().catch((err) => {
    console.error(err);
  });

  