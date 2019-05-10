const { getLotteryMatches, generatePlayer } = require('../lib/helpers');

const LotteryMatch = artifacts.require('LotteryMatch');
const LotteryMaster = artifacts.require('LotteryMaster');

const N = 2;
const price = 1000;
const t0 = 100;
const tFinal = 200;
const td = 2;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const MatchPhases = {
  COMMIT: 'COMMIT',
  REVEAL: 'REVEAL',
  PLAY: 'PLAY',
};

const generateFirstLevelMatch = async (
  player1,
  player2,
  lottery,
  phase = MatchPhases.PLAY
) => {
  match = await LotteryMatch.new(1, 2, 3);
  await lottery.setFinalMatch(match.address);

  lottery.deposit({ from: player1.address, value: price });
  lottery.deposit({ from: player2.address, value: price });

  await match.initFirstLevelMatch(lottery.address, 0);

  if (phase === MatchPhases.COMMIT) return match;

  await match.commit(player1.commitment, { from: player1.address });
  await match.commit(player2.commitment, { from: player2.address });

  if (phase === MatchPhases.REVEAL) return match;

  await match.reveal(player1.secret, { from: player1.address });
  await match.reveal(player2.secret, { from: player2.address });

  return match;
};

const generateLottery = async (lottery, N, t0 = 0, td = 2) => {
  matchesParams = getLotteryMatches(N, t0, td);

  matches = {};

  for await (const [level, levelParams] of Object.entries(matchesParams)) {
    matches[level] = {};
    const promises = [];
    for await (const [key, value] of Object.entries(levelParams)) {
      const match = LotteryMatch.new(value.t0, value.t1, value.t2);
      promises.push(match);
      if (value.isFirstLevel) {
        match.then((m) => {
          promises.push(m.initFirstLevelMatch(lottery.address, value.index));
        });
      } else {
        const [leftLevel, leftMatch] = value.left;
        const [rightLevel, rightMatch] = value.right;
        match.then((m) => {
          promises.push(
            m.initInternalMatch(
              matches[leftLevel][leftMatch].address,
              matches[rightLevel][rightMatch].address
            )
          );
        });
      }
      match.then((m) => {
        matches[level][key] = m;
      });
    }
    await Promise.all(promises);
  }

  return matches;
};

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

  it('Should not be able to get the left or right match', async () => {
    const actual = await this.match.left();
    assert.isOk(actual);
  });
});

contract('LotteryMatch play', async (accounts) => {
  beforeEach(async () => {
    this.lottery = await LotteryMaster.new(N, price, t0, tFinal);

    this.player1 = generatePlayer({
      secret: 0b001,
      address: accounts[0],
    });
    this.player2 = generatePlayer({
      secret: 0b111,
      address: accounts[1],
    });
  });

  it('Should be able to determine the winner with 0 as LSB', async () => {
    match = await generateFirstLevelMatch(
      this.player1,
      this.player2,
      this.lottery
    );
    const expectedWinner = this.player1.address;
    assert.equal(expectedWinner, await match.getWinner());
  });

  it('Should be able to determine the winner with 1 as LSB', async () => {
    const player2 = generatePlayer({ address: accounts[1], secret: 0b100 });
    match = await generateFirstLevelMatch(this.player1, player2, this.lottery);
    const expectedWinner = player2.address;
    assert.equal(expectedWinner, await match.getWinner());
  });

  it('Should be able to determine the winner if one does not reveal', async () => {
    match = await generateFirstLevelMatch(
      this.player1,
      this.player2,
      this.lottery,
      MatchPhases.REVEAL
    );
    await match.reveal(this.player2.secret, { from: this.player2.address });

    const expectedWinner = this.player2.address;
    assert.equal(expectedWinner, await match.getWinner());
  });

  it('Should be able to determine the winner if one does not commit', async () => {
    match = await generateFirstLevelMatch(
      this.player1,
      this.player2,
      this.lottery,
      MatchPhases.COMMIT
    );
    await match.commit(this.player2.commitment, { from: this.player2.address });

    const expectedWinner = this.player2.address;
    assert.equal(expectedWinner, await match.getWinner());
  });

  it('Should not determine the winner if neither party reveals', async () => {
    match = await generateFirstLevelMatch(
      this.player1,
      this.player2,
      this.lottery,
      MatchPhases.REVEAL
    );

    const expectedWinner = ZERO_ADDRESS;
    assert.equal(expectedWinner, await match.getWinner());
  });

  it('Should not determine the winner if neither party commits', async () => {
    match = await generateFirstLevelMatch(
      this.player1,
      this.player2,
      this.lottery,
      MatchPhases.COMMIT
    );

    const expectedWinner = ZERO_ADDRESS;
    assert.equal(expectedWinner, await match.getWinner());
  });

  it('Should determine the winner if one player is unassigned', async () => {
    const _N = 4;
    const lottery = await LotteryMaster.new(_N, price, 0, 100);
    const matches = await generateLottery(lottery, _N);
    await lottery.setFinalMatch(matches[1][0].address);

    const player1 = generatePlayer({ address: accounts[0], secret: 0b101 });
    const player2 = generatePlayer({ address: accounts[1], secret: 0b100 });
    const player3 = generatePlayer({ address: accounts[2], secret: 0b111 });
    const player4 = generatePlayer({ address: accounts[3], secret: 0b111 });

    await lottery.deposit({ from: player1.address, value: price });
    await lottery.deposit({ from: player2.address, value: price });
    await lottery.deposit({ from: player3.address, value: price });
    await lottery.deposit({ from: player4.address, value: price });

    await matches[0][0].commit(player1.commitment, { from: player1.address });
    await matches[0][0].commit(player2.commitment, { from: player2.address });
    await matches[0][1].commit(player3.commitment, { from: player3.address });

    await matches[0][0].reveal(player1.secret, { from: player1.address });
    await matches[0][0].reveal(player2.secret, { from: player2.address });
    await matches[0][1].reveal(player3.secret, { from: player3.address });

    await matches[1][0].commit(player2.commitment, { from: player2.address });
    await matches[1][0].commit(player3.commitment, { from: player3.address });

    await matches[1][0].reveal(player2.secret, { from: player2.address });
    await matches[1][0].reveal(player3.secret, { from: player3.address });

    const expectedWinner = player3.address;

    assert.equal(expectedWinner, await matches[1][0].getWinner());
  });

  it('Should not determine the winner if both players are unassigned', async () => {
    const _N = 4;
    const lottery = await LotteryMaster.new(_N, price, 0, 100);
    const matches = await generateLottery(lottery, _N);
    await lottery.setFinalMatch(matches[1][0].address);

    const player1 = generatePlayer({ address: accounts[0], secret: 0b101 });
    const player2 = generatePlayer({ address: accounts[1], secret: 0b100 });
    const player3 = generatePlayer({ address: accounts[2], secret: 0b111 });
    const player4 = generatePlayer({ address: accounts[3], secret: 0b111 });

    await lottery.deposit({ from: player1.address, value: price });
    await lottery.deposit({ from: player2.address, value: price });
    await lottery.deposit({ from: player3.address, value: price });
    await lottery.deposit({ from: player4.address, value: price });

    await matches[0][0].commit(player1.commitment, { from: player1.address });
    await matches[0][0].commit(player2.commitment, { from: player2.address });

    await matches[0][0].reveal(player1.secret, { from: player1.address });
    await matches[0][0].reveal(player2.secret, { from: player2.address });

    await matches[1][0].commit(player2.commitment, { from: player2.address });

    const expectedWinner = player2.address;

    assert.equal(expectedWinner, await matches[1][0].getWinner());
  });
});
