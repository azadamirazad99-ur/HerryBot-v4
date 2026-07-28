
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Deletes a specified number of messages from the channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: '❌ Please provide a number between 1 and 100.', ephemeral: true });
        }

        try {
            await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `🧹 Successfully cleared ${amount} messages.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Failed to delete messages (Messages older than 14 days cannot be bulk deleted).', ephemeral: true });
        }
    },
};

// ==========================================
// FAST PREFIX COMMAND SUPPORT (!clear <number>)
// Is code ko apni index.js ke messageCreate event mein daal dena:
/*
if (command === 'clear') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ You do not have permission to use this command.');
    }

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) {
        return message.reply('❌ Please specify a valid number between 1 and 100! Example: `!clear 10`');
    }

    try {
        message.delete().catch(() => {});
        const deleted = await message.channel.bulkDelete(amount, true);
        const replyMsg = await message.channel.send(`🧹 Successfully cleared **${deleted.size}** messages.`);
        setTimeout(() => replyMsg.delete().catch(() => {}), 4000);
    } catch (error) {
        console.error(error);
        message.channel.send('❌ Failed to clear messages (Messages older than 14 days cannot be deleted).');
    }
}
*/
