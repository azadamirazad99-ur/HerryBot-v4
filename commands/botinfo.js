const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Shows information about the bot.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('HerryBot Info')
            .setDescription('Your custom Discord bot running smoothly!')
            .addFields(
                { name: 'Status', value: 'Online & Active', inline: true },
                { name: 'Platform', value: 'Railway', inline: true }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
}; 

