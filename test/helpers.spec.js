const LotteryMaster = artifacts.require('LotteryMaster');

const {
  getLotteryMatches,
  generatePlayers,
  setUpLottery,
} = require('../lib/helpers');

describe('getLotteryMatches', () => {
  it('Should return an object', () => {
    const N = 32;
    const tCommit = 10;
    const td = 2;
    const actual = getLotteryMatches(N, tCommit, td);
    assert.isObject(actual);
  });
});

contract('setUpLottery', () => {
  it('Should set up matches correctly', async () => {
    const N = 8;
    const price = 1000;
    const tStart = 0;
    const td = 2;

    const lottery = await LotteryMaster.new(N, price, tStart);

    const matches = await setUpLottery(lottery, N, tStart, td);

    assert.isOk(matches);
    assert.isArray(matches);
    assert.equal(matches.length, Math.floor(Math.log2(N)));

    const totalMatches = matches.reduce(
      (acc, matches) => acc + matches.length,
      0
    );

    assert.equal(totalMatches, N - 1, 'Number of matches not correct');
  });
});

describe('generatePlayers', () => {
  it('Should generate n players', () => {
    const accounts = [
      '0x14723a09acff6d2a60dcdf7aa4aff308fddc160c',
      '0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db',
      '0x583031d1113ad414f02576bd6afabfb302140225',
      '0xdd870fa1b7c4700f2bd7f44238821c26f7392148',
    ];
    const n = accounts.length;
    const players = generatePlayers(n, accounts, 1);
    console.log(players);
    assert.isArray(players);
    assert.equal(n, players.length);
    for (const [i, { address, commitment, secret }] of players.entries()) {
      assert.equal(address, accounts[i]);
      assert.isNumber(parseInt(secret, 16));
      assert.isString(commitment);
    }
  });
});
