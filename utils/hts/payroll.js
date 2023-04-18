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
  const treasuryId = AccountId.fromString(process.env.HASHPACK_ID);
  const treasuryKey = PrivateKey.fromString(process.env.HASHPACK_PRIVATE_KEY);
  const jmanId = AccountId.fromString(process.env.JMAN_WALLET_ID);
  const nbreezayId = AccountId.fromString(process.env.NBREEZAY_WALLET_ID);
  const alixonId = AccountId.fromString(process.env.ALIXON_WALLET_ID);
  const brettId = AccountId.fromString(process.env.BRETT_WALLET_ID);
  const supernalId = AccountId.fromString(process.env.SUPERNAL_WALLET_ID);

  
  const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);
  
  async function main() {
    const prevWeekBalance = 20.00   // Replace with previous weeks Balance
    const currWeekBalance = await getHbarBalance(treasuryId);
    const weeklyEarnings = Number((currWeekBalance - prevWeekBalance).toFixed(2));
  
    const founderShare = Number((weeklyEarnings * 0.20).toFixed(2)); // Founders = 20% Share
    const lawyerShare = Number((weeklyEarnings * 0.03).toFixed(2)); // Lawyer = 3% Share
    const companyShare = Number((weeklyEarnings * .37).toFixed(2)); // Company Share = 17% (Right now it's 37 due to Supernal/Poncho Sitch) 
    const remainingBalance = Number((prevWeekBalance + companyShare).toFixed(2));
    
    console.log(`Amount of Company Wallet HBAR at end of last payroll: ${prevWeekBalance}`);
    console.log(`Amount of Company Wallet HBAR currently: ${currWeekBalance}`);
    console.log(`Amount of HBAR made within this week: ${weeklyEarnings}`);
    console.log(`Amount HBAR to Company: ${companyShare}`);
    console.log(`Amount HBAR to Jman (Founder): ${founderShare}`);
    console.log(`Amount HBAR to Nbreezay (Founder): ${founderShare}`);
    console.log(`Amount HBAR to Alixon (Founder): ${founderShare}`);
    console.log(`Amount HBAR to Brett (Lawyer): ${lawyerShare}`);
    console.log(`Amount that will remain in the company wallet after distribution: ${remainingBalance}`);
    
    // Any Left over small amount to balance the transaction. This will go back to the company
    const leftOverAmt = Number((weeklyEarnings - companyShare - founderShare - founderShare - founderShare - lawyerShare).toFixed(2))

    console.log(`Amount of small leftover required to balance the transaction (Goes to Company Wallet): ${leftOverAmt}`);

    // Prompt for confirmation before executing the transaction
    const confirm = readlineSync.question(`Do you want to proceed with the transaction? (y/n): `);
    if (confirm !== 'y') {
        console.log(`Transaction cancelled by user`);
        return;
    }

    const sendHbar = await new TransferTransaction()
      .addHbarTransfer(treasuryId, Hbar.from(-weeklyEarnings))
      .addHbarTransfer(treasuryId, Hbar.from(companyShare))
      .addHbarTransfer(treasuryId, Hbar.from(leftOverAmt))
      .addHbarTransfer(jmanId, Hbar.from(founderShare))
      .addHbarTransfer(nbreezayId, Hbar.from(founderShare))
      .addHbarTransfer(alixonId, Hbar.from(founderShare))
      .addHbarTransfer(brettId, Hbar.from(lawyerShare))
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
  