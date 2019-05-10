const range = (start, end) => {
  if (!end) {
    end = start;
    start = 0;
  }
  assert(
    start >= 0 && end >= 0,
    `Start or end cannot be negative. Got range(${start}, ${end})`
  );
  assert(start <= end, `Start of be le end. Got range(${start}, ${end})`);
  if (start === end) return [];
  return [start, ...range(start + 1, end)];
};

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  range,
  timeout,
};
