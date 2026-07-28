
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeouts a member for a specific duration.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Duration in minutes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const minutes = interaction.options.getInteger('minutes');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!target) {
            return interaction.reply({ content: 'That user is not valid or not in this server.', ephemeral: true });
        }

        try {
            const durationMs = minutes * 60 * 1000;
            await target.timeout(durationMs, reason);
            await interaction.reply({ content: `Successfully timed out ${target.user.tag} for ${minutes} minutes. Reason: ${reason}` });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error trying to timeout this user!', ephemeral: true });
        }
    },
};
