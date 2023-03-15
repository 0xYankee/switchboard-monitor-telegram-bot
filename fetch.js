const { clusterApiUrl, Connection } = require('@solana/web3.js');
const {AccountNotFoundError, AggregatorAccount, SwitchboardProgram} = require('@switchboard-xyz/solana.js');

async function fetchLeaseBalance() {
  const connection = new Connection(clusterApiUrl('mainnet-beta'));
  const program = await SwitchboardProgram.load('mainnet-beta', connection);
  const aggregatorAccount = new AggregatorAccount(program, 'GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR');
  

  const balance = await aggregatorAccount.fetchBalance();
  console.log(`Lease Balance: ${balance}`);

  return balance;
}

module.exports = { fetchLeaseBalance };