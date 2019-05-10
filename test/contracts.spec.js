const LotteryMaster = artifacts.require('LotteryMaster');

const { LotteryContract } = require('../lib/contracts');

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
});
