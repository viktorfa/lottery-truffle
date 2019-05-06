const LotteryMaster = artifacts.require('LotteryMaster');

const N = 32;
const price = 1000;
const t0 = 100;
const tFinal = 200;

contract('LotteryMaster', async (accounts) => {
  beforeEach(async () => {
    this.lottery = await LotteryMaster.new(N, price, t0, tFinal);
  });
  it('Should be able to deploy', async () => {
    assert.isOk(this.lottery);
  });

  // TODO Need to do the check of whether there is a final match in Solidity
  it.skip('Should not be able to deposit when there is no final match', async () => {
    try {
      await this.lottery.deposit({ value: price });
      assert.fail('Expected transaction to be invalid.');
    } catch (error) {
      assert.include(error.message, 'revert');
    }
  });
});
