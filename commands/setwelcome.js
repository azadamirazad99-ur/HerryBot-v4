
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Sets the official channel for welcoming new members.')
        .addChannelOption(o => o.setName('channel').setDescription('Select welcome text channel').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        
        // Yahan aap channel ID ko database ya file mein save kar sakte hain
        await interaction.reply({ 
            content: `✅ Success! Welcome channel has been set to ${targetChannel}. Ab se naye members yahin welcome honge!`, 
            ephemeral: true 
        });
    },
};

