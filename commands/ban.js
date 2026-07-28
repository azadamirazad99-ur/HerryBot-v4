const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Permanently bans a member from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!target) {
            return interaction.reply({ content: 'That user is not valid or not in this server.', ephemeral: true });
        }

        try {
            await target.ban({ reason });
            await interaction.reply({ content: `Successfully banned ${target.user.tag}. Reason: ${reason}` });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error trying to ban this user! Check role hierarchy permissions.', ephemeral: true });
        }
    },
};

