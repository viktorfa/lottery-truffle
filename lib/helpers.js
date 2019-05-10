const LotteryMatch = artifacts.require('LotteryMatch');

const setUpLottery = async (lottery, N, tStart, td) => {
  const matchesParams = getLotteryMatches(N, tStart, td);
  const matches = [];
  for (const [level, levelParams] of Object.entries(matchesParams)) {
    matches.push(new Array(Object.keys(levelParams).length));
    const promises = [];
    for (const [key, value] of Object.entries(levelParams)) {
      const match = LotteryMatch.new(value.t0, value.t1, value.t2);
      promises.push(match);
      let m;
      if (value.isFirstLevel) {
        /*m = await match;
        promises.push(m.initFirstLevelMatch(lottery.address, value.index));*/
        match.then((m) => {
          promises.push(m.initFirstLevelMatch(lottery.address, value.index));
        });
      } else {
        const [leftLevel, leftMatch] = value.left;
        const [rightLevel, rightMatch] = value.right;
        /*m = await match;
        promises.push(
          m.initInternalMatch(
            matches[leftLevel][leftMatch].address,
            matches[rightLevel][rightMatch].address
          )
        );*/
        match.then((m) => {
          promises.push(
            m.initInternalMatch(
              matches[leftLevel][leftMatch].address,
              matches[rightLevel][rightMatch].address
            )
          );
        });
      }
      /*matches[level][key] = m;*/
      match.then((m) => {
        matches[level][key] = m;
      });
    }
    await Promise.all(promises);
  }

  return matches;
};

const getLotteryMatches = (N, tCommit, td) => {
  contracts = {};
  contracts[0] = {};

  levels = Math.floor(Math.log2(N));

  for (i = 0; i < N >> 1; i++) {
    contracts[0][i] = {
      index: i,
      isFirstLevel: true,
      t0: tCommit,
      t1: tCommit + td,
      t2: tCommit + td * 2,
      ref: [0, i],
    };
  }
  for (L = 1; L < levels; L++) {
    contracts[L] = {};
    for (i = 0; i < Math.pow(2, levels - 1 - L); i++) {
      const t = tCommit + 2 * td * L;
      contracts[L][i] = {
        left: [L - 1, 2 * i],
        right: [L - 1, 2 * i + 1],
        t0: t,
        t1: t + td,
        t2: t + td * 2,
      };
    }
  }

  return contracts;
};

const generatePlayer = ({ secret, address }) => {
  if (!secret) {
    secret = web3.utils.randomHex(8);
  }
  const commitment = web3.utils.soliditySha3(address, {
    type: 'uint',
    value: secret,
  });
  return {
    commitment,
    secret,
    address,
  };
};

const generatePlayers = (n, accounts, l = 8) => {
  const result = [];
  for (i of range(n)) {
    const address = accounts[i];
    const player = generatePlayer({ address }, l);
    result.push(player);
  }
  return result;
};

module.exports = {
  getLotteryMatches,
  generatePlayer,
  generatePlayers,
  setUpLottery,
};
