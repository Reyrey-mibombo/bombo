const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Apply for staff position'),
  
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('apply_modal')
      .setTitle('Staff Application');
    
    const questions = [
      new TextInputBuilder()
        .setCustomId('why')
        .setLabel('Why do you want to be staff?')
        .setStyle(TextInputStyle.Paragraph),
      
      new TextInputBuilder()
        .setCustomId('hours')
        .setLabel('Hours available per week?')
        .setStyle(TextInputStyle.Short)
    ];
    
    modal.addComponents(
      questions.map(q => 
        new ActionRowBuilder().addComponents(q)
      )
    );
    
    await interaction.showModal(modal);
  }
};