const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Shows information about a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get info about')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getMember('target') || interaction.member;
        const user = target.user;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`User Info - ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Username', value: user.tag, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: false },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
 
