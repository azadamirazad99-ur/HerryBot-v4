const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!target) {
            return interaction.reply({ content: 'That user is not valid or not in this server.', ephemeral: true });
        }

        try {
            await target.kick(reason);
            await interaction.reply(`Successfully kicked ${target.user.tag} for: ${reason}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error trying to kick this user!', ephemeral: true });
        }
    },
};
