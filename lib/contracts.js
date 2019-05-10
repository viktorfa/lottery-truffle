const LotteryMatch = artifacts.require('LotteryMatch');
const LotteryMaster = artifacts.require('LotteryMaster');
const { getLotteryMatches } = require('./helpers');

const setUpLottery = async (lottery, N, tStart, td) => {
  const matchesParams = getLotteryMatches(N, tStart, td);
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

    return matches;
  }
};

class Lottery {
  constructor(N, tStart, tFinal, td) {
    this.N = N;
    this.tStart = tStart;
    this.tFinal = tFinal;
    this.td = td;
  }

  async init() {
    this.lottery = await LotteryMaster.new(
      this.N,
      this.price,
      this.tStart,
      this.tFinal
    );
    return this;
  }

  async setUpMatches() {
    this.matches = await setUpLottery(
      this.lottery,
      this.N,
      this.tStart,
      this.td
    );
  }
}

class LotteryContract {
  constructor(lotteryAddress) {
    this.lotteryAddress = lotteryAddress;
  }

  async init() {
    this.lotteryContract = await LotteryMaster.at(this.lotteryAddress);

    this.finalMatch = await this.lotteryContract.finalMatch();
    return this;
  }

  async getMatchForPlayer(playerAddress) {
    const index = await this.getPlayers().indexOf(playerAddress);
  }

  async getPlayers() {
    if (!this.players) this.players = await this.lotteryContract.getPlayers();
    return this.players;
  }

  async getAllMatches() {
    const matches = [];
  }
}

module.exports = {
  LotteryContract,
  Lottery,
  setUpLottery,
};
