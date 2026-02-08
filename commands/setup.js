const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the bot for your server'),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Bot Setup')
      .setDescription('Bot is ready! Use `/apply` to apply for staff.')
      .setColor(0x00ff00);
    
    await interaction.reply({ embeds: [embed] });
  }
};