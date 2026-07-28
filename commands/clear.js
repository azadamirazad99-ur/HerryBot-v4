const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Deletes a specific number of messages from a channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        await interaction.channel.bulkDelete(amount, true).catch(error => {
            console.error(error);
            return interaction.reply({ content: 'There was an error trying to clear messages in this channel!', ephemeral: true });
        });

        return interaction.reply({ content: `Successfully deleted ${amount} messages.`, ephemeral: true });
    },
};

