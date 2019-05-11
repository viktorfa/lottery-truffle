const LotteryMaster = artifacts.require('LotteryMaster');

const { LotteryContract, LotteryBuilder } = require('../lib/contracts');

const N = 4;
const L = Math.floor(Math.log2(N));
const price = web3.utils.toWei('0.1', 'ether');
const tStart = 0;
const tFinal = 100;
const td = 2;

contract('LotteryContract', (accounts) => {
  beforeEach(async () => {
    this.lottery = await LotteryMaster.new(N, price, tStart, tFinal);
    this.lotteryContract = new LotteryContract(this.lottery.address);
  });
  it('Should be able to initialize', async () => {
    const actual = await this.lotteryContract.init();
    assert.isOk(actual);
  });
  it('getPlayers', async () => {
    const lotteryContract = new LotteryContract(this.lottery.address);
    await lotteryContract.init();
    const actual = await lotteryContract.getPlayers();
    assert.isOk(actual);
  });
  it('getAllMatches', async () => {
    const lotteryBuilder = new LotteryBuilder(N, price, tStart, tFinal, td);
    await lotteryBuilder.start();
    const lotteryContract = new LotteryContract(lotteryBuilder.lottery.address);
    await lotteryContract.init();

    const matches = await lotteryContract.getAllMatches();
    assert.isOk(matches);
    assert.isArray(matches);
    assert.equal(matches.length, Math.floor(Math.log2(N)));
    const totalMatches = matches.reduce(
      (acc, matches) => acc + matches.length,
      0
    );
    for (const levelMatches of matches) {
      for (const match of levelMatches) {
        assert.isOk(match, `Match is not ok: ${match}`);
      }
    }
    assert.equal(totalMatches, N - 1, 'Number of matches not correct');
  });
});
