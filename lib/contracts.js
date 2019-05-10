const LotteryMatch = artifacts.require('LotteryMatch');
const LotteryMaster = artifacts.require('LotteryMaster');
const { setUpLottery } = require('./helpers');
const { range } = require('./utils');
const { LotteryPhases } = require('./enums');

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
    this.phase = LotteryPhases.NOT_INITIALIZED;
  }

  async init() {
    this.lotteryContract = await LotteryMaster.at(this.lotteryAddress);

    const isInitialized = await this.lotteryContract.isInitialized();
    if (!isInitialized) this.phase = LotteryPhases.NOT_INITIALIZED;
    const isFull = await this.lotteryContract.isFull();
    if (!isFull) this.phase = LotteryPhases.INITIALIZED;
    else this.phase = LotteryPhases.FULL;

    this.finalMatch = await this.lotteryContract.finalMatch();
    this.N = await this.lotteryContract.N();
    this.price = await this.lotteryContract.price();
    return this;
  }

  async deposit(address) {
    return this.lotteryContract.deposit({ from: address, value: this.price });
  }

  async commit(address, commitment) {
    return this.lotteryContract.commit(commitment, { from: address });
  }

  async reveal(address, secret) {
    return this.lotteryContract.reveal(secret, { from: address });
  }

  async getMatchForPlayer(playerAddress) {
    const index = await this.getPlayers().indexOf(playerAddress);
  }

  async getPlayers() {
    if (!this.players) this.players = await this.lotteryContract.getPlayers();
    return this.players;
  }

  async getAllMatches() {
    if (this.phase === LotteryPhases.INITIALIZED && !this.matches) {
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
      this.matches = matches;
      return this.matches;
    } else if (this.matches) return this.matches;
    else throw new Error(`Matches not ready. Lottery in ${this.phase} phase.`);
  }
}

module.exports = {
  LotteryContract,
  LotteryBuilder,
  setUpLottery,
};
