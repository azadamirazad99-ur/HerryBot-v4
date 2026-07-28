
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

