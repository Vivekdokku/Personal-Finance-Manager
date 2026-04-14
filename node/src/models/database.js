const { db } = require("../config/database");

// Import model classes
const User = require("./User");
const Transaction = require("./Transaction");
const Role = require("./Role");

// Export database connection and model classes
module.exports = {
  db,
  User,
  Transaction,
  Role,

  // Legacy exports for backward compatibility (can be removed later)
  userQueries: {
    findByEmail: User.findByEmail.bind(User),
    findById: User.findById.bind(User),
    create: User.create.bind(User),
    getAll: User.getAll.bind(User),
    update: User.update.bind(User),
    delete: User.delete.bind(User),
    search: User.search.bind(User),
    getStats: User.getStats.bind(User),
  },

  transactionQueries: {
    findByUserId: Transaction.findByUserId.bind(Transaction),
    create: Transaction.create.bind(Transaction),
    update: Transaction.update.bind(Transaction),
    delete: Transaction.delete.bind(Transaction),
    findByIdAndUser: Transaction.findByIdAndUser.bind(Transaction),
    getSummaryByUser: Transaction.getSummaryByUser.bind(Transaction),
    getTotalsByUser: Transaction.getTotalsByUser.bind(Transaction),
    findByUserWithFilters: Transaction.findByUserWithFilters.bind(Transaction),
    getSummaryByUserWithFilters:
      Transaction.getSummaryByUserWithFilters.bind(Transaction),
    getCategoriesByUser: Transaction.getCategoriesByUser.bind(Transaction),
    getGlobalStats: Transaction.getGlobalStats.bind(Transaction),
    bulkDeleteByUser: Transaction.bulkDeleteByUser.bind(Transaction),
  },

  roleQueries: {
    getAll: Role.getAll.bind(Role),
    findById: Role.findById.bind(Role),
    findByName: Role.findByName.bind(Role),
    create: Role.create.bind(Role),
    update: Role.update.bind(Role),
    delete: Role.delete.bind(Role),
    exists: Role.exists.bind(Role),
    getUsageStats: Role.getUsageStats.bind(Role),
    hasPermission: Role.hasPermission.bind(Role),
    getDefaultRole: Role.getDefaultRole.bind(Role),
  },
};
