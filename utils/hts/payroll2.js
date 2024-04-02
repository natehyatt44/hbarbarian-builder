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
  const royaltyId = AccountId.fromString(process.env.ROYALTY2_WALLET_ID);
  const royaltyKey = PrivateKey.fromString(process.env.ROYALTY2_PRIVATE_KEY);
  const companyId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
  const jmanId = AccountId.fromString(process.env.JMAN_WALLET_ID);
  const nbreezayId = AccountId.fromString(process.env.NBREEZAY_WALLET_ID);
  const jordanId = AccountId.fromString("0.0.467126");
  const client = Client.forMainnet().setOperator(royaltyId, royaltyKey);
  
  async function main() {

    let currBalance = await getHbarBalance(royaltyId);
    currBalance = Number(currBalance - 2).toFixed(2); // We minus 2 here for any gas fees and so that we don't empty wallet completely
    
    const jmanShare = Number((currBalance * 0.30).toFixed(2)); 
    const nateShare = Number((currBalance * 0.30).toFixed(2)); 
    const jordanShare = Number((currBalance * 0.20).toFixed(2)); 

    const companyShare = Number((currBalance - jmanShare - nateShare - jordanShare).toFixed(2));
    
    console.log(`Amount of Payroll Wallet HBAR currently (minus 2h): ${currBalance}`);
    console.log(`Amount HBAR to Company (20%): ${companyShare}`);
    console.log(`Amount HBAR to Jman (30%): ${jmanShare}`);
    console.log(`Amount HBAR to Nbreezay (30%): ${nateShare}`);
    console.log(`Amount HBAR to Jordan (20%): ${jordanShare}`);

    // Prompt for confirmation before executing the transaction
    const confirm = readlineSync.question(`Do you want to proceed with the transaction? (y/n): `);
    if (confirm !== 'y') {
        console.log(`Transaction cancelled by user`);
        return;
    }

    const sendHbar = await new TransferTransaction()
      .addHbarTransfer(royaltyId, Hbar.from(-currBalance))
      .addHbarTransfer(companyId, Hbar.from(companyShare))
      .addHbarTransfer(jmanId, Hbar.from(jmanShare))
      .addHbarTransfer(nbreezayId, Hbar.from(nateShare))
      .addHbarTransfer(jordanId, Hbar.from(jordanShare))
      .execute(client);
  
    const transactionReceipt = await sendHbar.getReceipt(client);
    console.log(
      "Payroll Transaction: " +
        transactionReceipt.status.toString()
    );
  }
  
  async function getHbarBalance(accountId) {
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    return balance.hbars.toBigNumber().toString();
  }
  
  main().catch((err) => {
    console.error(err);
  });
  