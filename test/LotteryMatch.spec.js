const LotteryMatch = artifacts.require('LotteryMatch');

contract('LotteryMatch', async (accounts) => {
  beforeEach(async () => {
    this.match = await LotteryMatch.new(1, 2, 3);
  });
  it('Should be able to deploy', async () => {
    assert.isOk(this.match);
  });

  it('Should not be able to commit when not initialized', async () => {
    try {
      await this.match.commit(web3.utils.fromAscii('abc'));
      assert.fail();
    } catch (error) {
      assert.include(error.message, 'revert');
    }
  });
  
  it('Should not be able to reveal when not initialized', async () => {
    try {
      await this.match.reveal(123);
      assert.fail();
    } catch (error) {
      assert.include(error.message, 'revert');
    }
  });
});
