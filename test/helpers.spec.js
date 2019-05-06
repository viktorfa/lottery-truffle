const { getLotteryMatches } = require('./helpers');

describe('getLotteryMatches', () => {
  it('Should return an object', () => {
    const N = 32;
    const tCommit = 10;
    const td = 2;
    const actual = getLotteryMatches(N, tCommit, td);
    assert.isObject(actual);
  });
});
