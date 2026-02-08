const { QuickDB } = require('quick.db');
const db = new QuickDB({ filePath: './data/database.sqlite' });

module.exports = {
  async get(key) {
    return await db.get(key);
  },
  
  async set(key, value) {
    return await db.set(key, value);
  },
  
  async delete(key) {
    return await db.delete(key);
  }
};