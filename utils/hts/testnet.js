const {
    Client,
    PrivateKey,
    Hbar,
    TransferTransaction,
    AccountBalanceQuery,
    AccountId,
  } = require("@hashgraph/sdk");
  require("dotenv").config();
  const readlineSync = require('readline-sync');
  
  // Configure accounts and client, and generate needed keys
  const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
  const treasuryId = AccountId.fromString(process.env.HASHPACK_ID);
  const treasuryKey = PrivateKey.fromString(process.env.HASHPACK_PRIVATE_KEY);
  
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  
  async function main() {
    
    const sendHbar = await new TransferTransaction()
      .addHbarTransfer(operatorId, Hbar.from(-5000))
      .addHbarTransfer(treasuryId, Hbar.from(5000))
      .execute(client);
  
    const transactionReceipt = await sendHbar.getReceipt(client);
    console.log(
      "Payroll Transaction: " +
        transactionReceipt.status.toString()
    );
  }
  
  
  main().catch((err) => {
    console.error(err);
  });
  