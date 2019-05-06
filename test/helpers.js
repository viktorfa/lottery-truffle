module.exports.getLotteryMatches = (N, tCommit, td) => {
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
