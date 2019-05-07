const { getLotteryMatches } = require('./helpers');
const LotteryMaster = artifacts.require('LotteryMaster');
const LotteryMatch = artifacts.require('LotteryMatch');

const N = 8;
const price = 1000;
const t0 = 100;
const tFinal = 200;
const td = 2;

contract('Lottery integration test', async (accounts) => {
  beforeEach(async () => {
    this.lottery = await LotteryMaster.new(N, price, t0, tFinal);
    this.matchesParams = getLotteryMatches(N, t0, td);

    this.matches = {};

    for await (const [level, levelParams] of Object.entries(
      this.matchesParams
    )) {
      this.matches[level] = {};
      const promises = [];
      for await (const [key, value] of Object.entries(levelParams)) {
        const match = LotteryMatch.new(value.t0, value.t1, value.t2);
        promises.push(match);
        if (value.isFirstLevel) {
          match.then((m) => {
            promises.push(
              m.initFirstLevelMatch(this.lottery.address, value.index)
            );
          });
        } else {
          const [leftLevel, leftMatch] = value.left;
          const [rightLevel, rightMatch] = value.right;
          match.then((m) => {
            promises.push(
              m.initInternalMatch(
                this.matches[leftLevel][leftMatch].address,
                this.matches[rightLevel][rightMatch].address
              )
            );
          });
        }
        match.then((m) => {
          this.matches[level][key] = m;
        });
      }
      await Promise.all(promises);
    }
    this.finalMatch = this.matches[Object.keys(this.matches).length - 1][0];
  });

  it('Should set up all matches', () => {
    assert.isOk(this.finalMatch);
    assert.equal(
      Object.values(this.matches).reduce(
        (acc, val) => acc + Object.keys(val).length,
        0
      ),
      N - 1
    );
  });
  it('Should be able to play correctly', async () => {
    await this.lottery.setFinalMatch(this.finalMatch.address);

    const players = [];
    const playerMap = {};
    for (let i = 0; i < N; i++) {
      const secret = web3.utils.randomHex(8);
      const address = accounts[i];
      const commitment = web3.utils.soliditySha3(address, {
        type: 'uint',
        value: secret,
      });

      const player = {
        secret,
        address,
        commitment,
      };
      players.push(player);
      playerMap[address] = player;
      await this.lottery.deposit({ from: address, value: price });
    }

    // Start playing at each level
    for await (const [level, matches] of Object.entries(this.matches)) {
      // Do commitments in current level
      for await (const [matchNumber, match] of Object.entries(matches)) {
        if (level === 0 || level === '0') {
          const playerIndex =
            matchNumber % 2 === 0 ? matchNumber * 2 : matchNumber * 2 + 1;
          await match.commit(players[playerIndex].commitment, {
            from: players[playerIndex].address,
          });
        } else {
          const left = await LotteryMatch.at(await match.getLeft());
          const right = await LotteryMatch.at(await match.getRight());
          const leftWinner = playerMap[await left.getWinner()];
          const rightWinner = playerMap[await right.getWinner()];
          await match.commit(leftWinner.commitment, {
            from: leftWinner.address,
          });
          await match.commit(rightWinner.commitment, {
            from: rightWinner.address,
          });
        }
      }
      // Do reveals in current level
      for await (const [matchNumber, match] of Object.entries(matches)) {
        if (level === 0 || level === '0') {
          const playerIndex =
            matchNumber % 2 === 0 ? matchNumber * 2 : matchNumber * 2 + 1;
          await match.reveal(players[playerIndex].secret, {
            from: players[playerIndex].address,
          });
        } else {
          const left = await LotteryMatch.at(await match.getLeft());
          const right = await LotteryMatch.at(await match.getRight());
          const leftWinner = playerMap[await left.getWinner()];
          const rightWinner = playerMap[await right.getWinner()];
          await match.reveal(leftWinner.secret, {
            from: leftWinner.address,
          });
          await match.reveal(rightWinner.secret, {
            from: rightWinner.address,
          });
        }
      }
    }
    const lotteryWinner = await this.finalMatch.getWinner();
    console.log(`Lottery winner: ${lotteryWinner}`);
    assert.isOk(lotteryWinner);

    await this.lottery.withdraw({
      from: lotteryWinner,
    });
  });
});
