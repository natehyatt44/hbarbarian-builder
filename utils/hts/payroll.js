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
  const royaltyId = AccountId.fromString(process.env.ROYALTY_WALLET_ID);
  const royaltyKey = PrivateKey.fromString(process.env.ROYALTY_PRIVATE_KEY);
  const companyId = AccountId.fromString(process.env.COMPANY_WALLET_ID);
  const jmanId = AccountId.fromString(process.env.JMAN_WALLET_ID);
  const nbreezayId = AccountId.fromString(process.env.NBREEZAY_WALLET_ID);
  const alixonId = AccountId.fromString(process.env.ALIXON_WALLET_ID);
  const brettId = AccountId.fromString(process.env.BRETT_WALLET_ID);
  const ladyHId = AccountId.fromString(process.env.LADYH_WALLET_ID);
  const supernalId = AccountId.fromString(process.env.SUPERNAL_WALLET_ID);

  const client = Client.forMainnet().setOperator(royaltyId, royaltyKey);
  
  async function main() {

    let currBalance = await getHbarBalance(royaltyId);
    currBalance = Number(currBalance - 10).toFixed(2); // We minus 50 here for any gas fees and so that we don't empty wallet completely
    
    const founderShare = Number((currBalance * 0.20).toFixed(2)); // Founders = 20% Share
    const supernalShare = Number((currBalance * 0.10).toFixed(2)); // Supernal = 10% Share
    const lawyerShare = Number((currBalance * 0.05).toFixed(2)); // Lawyer = 5% Share
    const ladyHShare = Number((currBalance * 0.03).toFixed(2)); // Lady H = 3% Share


    const companyShare = Number((currBalance - founderShare - founderShare - founderShare - supernalShare - lawyerShare - ladyHShare).toFixed(2));
    
    console.log(`Amount of Payroll Wallet HBAR currently (minus 10h): ${currBalance}`);
    console.log(`Amount HBAR to Company (22%): ${companyShare}`);
    console.log(`Amount HBAR to Jman (20%): ${founderShare}`);
    console.log(`Amount HBAR to Nbreezay (20%): ${founderShare}`);
    console.log(`Amount HBAR to Alixon (20%): ${founderShare}`);
    console.log(`Amount HBAR to Supernal (10%): ${supernalShare}`);
    console.log(`Amount HBAR to Brett (Lawyer) (5%): ${lawyerShare}`);
    console.log(`Amount HBAR to LadyH (3%): ${ladyHShare}`);

    // Prompt for confirmation before executing the transaction
    const confirm = readlineSync.question(`Do you want to proceed with the transaction? (y/n): `);
    if (confirm !== 'y') {
        console.log(`Transaction cancelled by user`);
        return;
    }

    const sendHbar = await new TransferTransaction()
      .addHbarTransfer(royaltyId, Hbar.from(-currBalance))
      .addHbarTransfer(companyId, Hbar.from(companyShare))
      .addHbarTransfer(jmanId, Hbar.from(founderShare))
      .addHbarTransfer(nbreezayId, Hbar.from(founderShare))
      .addHbarTransfer(alixonId, Hbar.from(founderShare))
      .addHbarTransfer(supernalId, Hbar.from(supernalShare))
      .addHbarTransfer(brettId, Hbar.from(lawyerShare))
      .addHbarTransfer(ladyHId, Hbar.from(ladyHShare))
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
  