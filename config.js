module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  ownerIds: process.env.OWNER_IDS?.split(',') || [],
  
  defaults: {
    features: {
      applications: true,
      appeals: true,
      reports: true,
      suggestions: true,
      welcomeMessages: true
    }
  }
};