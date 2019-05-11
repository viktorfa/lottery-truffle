const { LotteryBuilder, LotteryContract } = require('../lib/contracts');
const { generatePlayers } = require('../lib/helpers');
const { getMatchForPlayer } = require('../lib/utils');

const N = 8;
const price = web3.utils.toWei('1', 'ether');
const tStart = 100;
const tFinal = 200;
const td = 2;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('Simulate lottery build', (accounts) => {
  it('Should build master contract and match contracts for n players', async () => {
    const L = 2;
    const N = 2 ** L;

    const organizerAddress = accounts[0];
    const organizerInitialBalance = web3.utils.fromWei(
      await web3.eth.getBalance(organizerAddress),
      'ether'
    );

    console.log(`Organizer has ${organizerInitialBalance} ether`);

    console.log(`Building lottery with ${N} players.`);
    const startTime = new Date();
    const lotteryBuilder = new LotteryBuilder(N, price, tStart, tFinal, td);

    const sub = web3.eth.subscribe('pendingTransactions');

    sub.on('data', (data) => {
      console.log('data');
      console.log(data);
    });
    await lotteryBuilder.start();
    console.log(`Built lottery in ${new Date() - startTime} ms`);

    const organizerFinalBalance = web3.utils.fromWei(
      await web3.eth.getBalance(organizerAddress),
      'ether'
    );

    console.log(`Organizer has ${organizerFinalBalance} ether`);
    console.log(
      `Organizer used ${organizerInitialBalance -
        organizerFinalBalance} ether for gas.`
    );
    console.log('Gas price is by default 20 gwei.');
  });
});
contract('Simulate lottery play', (accounts) => {
  it('Should play correctly', async () => {
    const L = 2;
    const N = 2 ** L;

    console.log(`Simulating lottery with ${N} players.`);
    let startTime = new Date();
    let tempTime = new Date();

    const lotteryBuilder = new LotteryBuilder(N, price, tStart, tFinal, td);
    await lotteryBuilder.start();

    console.log(`Built lottery in ${new Date() - tempTime} ms`);
    tempTime = new Date();

    const lottery = new LotteryContract(lotteryBuilder.lottery.address);
    await lottery.init();

    console.log(
      `Initialized lottery playing contract in ${new Date() - tempTime} ms`
    );
    tempTime = new Date();

    const matches = await lottery.getAllMatches();

    console.log(`Got all lottery matches in ${new Date() - tempTime} ms`);
    tempTime = new Date();

    const players = generatePlayers(N, accounts);
    const playerMap = players.reduce(
      (acc, x) => ({ ...acc, [x.address]: x }),
      {}
    );

    for (const { address } of players) {
      await lottery.deposit(address);
    }

    console.log(`All players joined in ${new Date() - tempTime} ms`);
    tempTime = new Date();

    const contractPlayers = await lottery.getPlayers();

    let winners = contractPlayers.map((address) => playerMap[address]);
    let level = 0;

    while (winners.length > 1) {
      console.log(`Playing level ${level}.`);
      for (const [i, { address, commitment }] of winners.entries()) {
        await matches[level][i >> 1].commit(commitment, { from: address });
      }
      for (const [i, { address, secret }] of winners.entries()) {
        await matches[level][i >> 1].reveal(secret, { from: address });
      }
      winners = await Promise.all([
        ...matches[level].map(async (match) => {
          return playerMap[await match.getWinner()];
        }),
      ]);
      level++;
      console.log(`Played level ${level} in ${new Date() - tempTime} ms`);
      tempTime = new Date();
    }
    console.log(`Played lottery in ${new Date() - startTime} ms`);

    const winner = await lottery.getWinner();
    assert.notEqual(winner, ZERO_ADDRESS);
    assert.equal(winner, winners[0].address);

    await lottery.lotteryContract.withdraw({ from: winner });

    console.log(
      `Winner is ${winner} who now has ${web3.utils.fromWei(
        await web3.eth.getBalance(winner),
        'ether'
      )} eth`
    );
  });
});
