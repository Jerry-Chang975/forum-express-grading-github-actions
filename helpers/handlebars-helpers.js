const dayjs = require('dayjs')
module.exports = {
  currentYear: () => dayjs().year(),
  equal: (a, b) => a === b
}
