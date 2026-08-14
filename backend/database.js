if (!process.env.DATABASE_URL) {
  module.exports = require('./database.sqlite');
} else {
  module.exports = require('./database.postgres');
}
