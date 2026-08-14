const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Sends the official support ticket panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
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

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Ticket panel successfully send ho gaya hai!', ephemeral: true });
    },
};

