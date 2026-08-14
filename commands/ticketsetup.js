
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Sets the ticket panel channel.')
        .addChannelOption(o => 
            o.setName('channel')
             .setDescription('Select channel for ticket panel')
             .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');

        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🎫 Support Tickets')
            .setDescription('Need help or want to report something? Click the button below to open a private support ticket.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('🎟️ Create Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        try {
            await targetChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Ticket panel successfully ${targetChannel} mein bhej diya gaya hai!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Us channel par message bhejne ki permission nahi hai!', ephemeral: true });
        }
    },
};
