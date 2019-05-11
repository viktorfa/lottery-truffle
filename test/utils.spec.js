const { range, generatePlayers } = require('../lib/utils');

describe('range', () => {
  it('Should return an enumerated array of length n', () => {
    assert.equal(5, range(5).length);
    assert.equal(1, range(1).length);
  });
  it('Should return an empty array if start equals end', () => {
    assert.equal(0, range(5, 5).length);
  });
  it('Should work with start and end', () => {
    assert.equal(1, range(1, 2).length);
    assert.deepEqual([1], range(1, 2));
  });
  it('Should have correct items', () => {
    assert.deepEqual([0], range(1));
  });
});
