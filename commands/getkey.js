const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateUserKey } = require('../keysystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your 3-Day access key / 3-Day key hasil karein'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const result = await getOrCreateUserKey(userId);

        if (result.error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Key Generation Failed!')
                .setDescription(
                    `**System Error:** Could not sync with GitHub repository.\n\n` +
                    `*Please check if \`GITHUB_TOKEN\` is set in Railway/hosting environment variables.*`
                );
            return interaction.editReply({ embeds: [errorEmbed] });
        }

        if (!result.isNew) {
            const embed = new EmbedBuilder()
                .setColor('#FF9900')
                .setTitle('⚠️ Active Key Already Exists!')
                .setDescription(
                    `**ENGLISH:**\nYou already have an active 3-day key.\n\n` +
                    `**ROMAN URDU:**\nAapke paas pehle se active key maujood hai.\n\n` +
                    `🔑 **Your Active Key:**\n\`\`\`${result.key}\`\`\``
                )
                .addFields(
                    { name: '⏳ Time Remaining', value: `\`${result.hoursLeft} Hours\` left.`, inline: false }
                );

            return interaction.editReply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ New Access Key Generated!')
                .setDescription(
                    `**ENGLISH:**\nYour 3-day access key has been generated and saved!\n\n` +
                    `**ROMAN URDU:**\nAapki 3-day key ban gayi hai aur server par save ho gayi hai.\n\n` +
                    `🔑 **Your Access Key:**\n\`\`\`${result.key}\`\`\``
                )
                .addFields(
                    { name: '⏳ Validity', value: `Valid for **72 Hours (3 Days)**.`, inline: false }
                );

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
