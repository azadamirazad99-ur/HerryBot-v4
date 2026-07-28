const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Creates a simple voting poll.')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle('📊 Community Poll')
            .setDescription(question)
            .setTimestamp();
        const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });
        await pollMessage.react('👍');
        await pollMessage.react('👎');
    },
}; 
