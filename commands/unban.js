const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user by their user ID')
        .addStringOption(option => 
            option.setName('userid')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const userId = interaction.options.getString('userid');

        try {
            await interaction.guild.members.unban(userId);
            await interaction.reply({ content: `Successfully unbanned user with ID: ${userId}`, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: 'Could not unban this user. Please check if the ID is correct and if they are actually banned.', ephemeral: true });
        }
    },
};

