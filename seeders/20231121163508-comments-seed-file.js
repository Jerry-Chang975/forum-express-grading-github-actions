'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Comments', [
      {
        user_id: 1,
        restaurant_id: 1,
        text: '好吃',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 1,
        restaurant_id: 1,
        text: '推推!',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 2,
        restaurant_id: 1,
        text: '還行',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 3,
        restaurant_id: 2,
        text: '必吃!',
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments', {})
  }
}
