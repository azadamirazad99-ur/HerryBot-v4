const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Displays a user avatar.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${target.tag}'s Avatar`)
            .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }))
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
 
