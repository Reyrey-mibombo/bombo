module.exports = {
  name: 'ready',
  once: true,
  
  execute(client) {
    console.log(`✅ Bot is online as ${client.user.tag}!`);
    console.log(`🌐 Serving ${client.guilds.cache.size} servers`);
    
    client.user.setActivity({
      name: '/help for commands',
      type: 3
    });
  }
};