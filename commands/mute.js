const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeouts (mutes) a member for a specific time.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to mute')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Duration in minutes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for muting'))
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
            await interaction.reply(`Successfully muted ${target.user.tag} for ${minutes} minutes. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error trying to mute this user!', ephemeral: true });
        }
    },
};
