const { getLotteryMatches, setUpLottery } = require('../lib/helpers');
const LotteryMaster = artifacts.require('LotteryMaster');
const LotteryMatch = artifacts.require('AbstractLotteryMatch');

const N = 8;
const price = 1000;
const tStart = 100;
const td = 2;

contract('Lottery integration test', async (accounts) => {
  beforeEach(async () => {
    this.lottery = await LotteryMaster.new(N, price, tStart);
    this.matchesParams = getLotteryMatches(N, tStart, td);

    this.matches = await setUpLottery(this.lottery, N, tStart, td);

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

  it('Should have a winner even if nobody does anything as long as all players have joined', async () => {
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

    const finalMatch = await LotteryMatch.at(await this.lottery.finalMatch());
    const winner = await finalMatch.getWinner();

    assert.isOk(winner);
    assert.equal(
      winner,
      players[0].address,
      'First player should be default winner'
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
          const left = await LotteryMatch.at(await match.left());
          const right = await LotteryMatch.at(await match.right());
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
          const left = await LotteryMatch.at(await match.left());
          const right = await LotteryMatch.at(await match.right());
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
