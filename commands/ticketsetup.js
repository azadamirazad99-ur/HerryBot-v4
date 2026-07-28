const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Sends the ticket creation panel in the specified channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where the ticket panel will be sent')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');

        // Ticket Embed Design
        const ticketEmbed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🎫 GrandHacks Support Tickets')
            .setDescription('Need help or want to report something? Click the button below to create a private ticket with our staff team.')
            .setFooter({ text: 'GrandHacks Security System', iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        // Create Ticket Button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Create Ticket')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎫'),
            );

        try {
            // Send the panel to the selected channel
            await targetChannel.send({ embeds: [ticketEmbed], components: [row] });
            await interaction.reply({ content: `✅ Ticket panel has been successfully sent to ${targetChannel}!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Failed to send the ticket panel. Make sure I have permissions to send messages in that channel!', ephemeral: true });
        }
    },
}; 
