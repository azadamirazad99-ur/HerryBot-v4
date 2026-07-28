
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Makes the bot repeat your message in the channel.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The text you want the bot to say')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const text = interaction.options.getString('message');
        
        await interaction.channel.send(text);
        await interaction.reply({ content: '✅ Message sent successfully!', ephemeral: true });
    },
};

// ==========================================
// FAST PREFIX COMMAND SUPPORT (!say <message>)
// Is code ko apni index.js ke messageCreate event mein daal dena:
/*
if (command === 'say') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ You do not have permission to use this command.');
    }

    const sayMessage = args.join(' ');
    if (!sayMessage) return message.reply('❌ Please provide a message for the bot to say! Example: `!say Hello everyone`');

    message.delete().catch(() => {});
    message.channel.send(sayMessage);
}
*/
