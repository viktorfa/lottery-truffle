const LotteryMatch = artifacts.require('LotteryMatch');
const LotteryMaster = artifacts.require('LotteryMaster');
const { setUpLottery } = require('./helpers');
const { range } = require('./utils');

class LotteryBuilder {
  constructor(N, price, tStart, tFinal, td) {
    this.N = N;
    this.price = price;
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
    assert(this.lottery, 'Not initialized');
    this.matches = await setUpLottery(
      this.lottery,
      this.N,
      this.tStart,
      this.td
    );
    return this.lottery.setFinalMatch(
      this.matches[this.matches.length - 1][0].address
    );
  }

  async start() {
    if (!this.lottery) {
      await this.init();
    }
    if (!this.matches) {
      return this.setUpMatches();
    }
  }
}

class LotteryContract {
  constructor(lotteryAddress) {
    this.lotteryAddress = lotteryAddress;
  }

  async init() {
    this.lotteryContract = await LotteryMaster.at(this.lotteryAddress);

    this.finalMatch = await this.lotteryContract.finalMatch();
    this.N = await this.lotteryContract.N();
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
    const finalMatch = await this.lotteryContract.finalMatch();
    matches.push([await LotteryMatch.at(finalMatch)]);
    for (const l of range(1, Math.floor(Math.log2(this.N)))) {
      matches.push(new Array(2 ** l));
      for (const i of range(2 ** (l - 1))) {
        const [left, right] = await Promise.all([
          matches[l - 1][i >> 1].left(),
          matches[l - 1][i >> 1].right(),
        ]);
        matches[l][i] = await LotteryMatch.at(left);
        matches[l][i + 1] = await LotteryMatch.at(right);
      }
    }
    return matches;
  }
}

module.exports = {
  LotteryContract,
  LotteryBuilder,
  setUpLottery,
};
