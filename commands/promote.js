const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promote a staff member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to promote')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('rank')
        .setDescription('New rank')
        .setRequired(true)
        .addChoices(
          { name: 'Helper', value: 'helper' },
          { name: 'Staff', value: 'staff' }
        )),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const rank = interaction.options.getString('rank');
    
    const embed = new EmbedBuilder()
      .setTitle('🎉 Promotion')
      .setDescription(`Promoted ${user.tag} to ${rank}!`)
      .setColor(0x00ff00);
    
    await interaction.reply({ embeds: [embed] });
  }
};