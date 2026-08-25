
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateUserKey } = require('../keySystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your 3-Day access key for scripts / Apni 3-Day key hasil karein'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const result = getOrCreateUserKey(userId);

        if (!result.isNew) {
            // ALREADY HAVE KEY (English + Roman Urdu)
            const embed = new EmbedBuilder()
                .setColor('#FF9900')
                .setTitle('⚠️ Active Key Already Exists!')
                .setDescription(
                    `**ENGLISH:**\nYou already have an active 3-day key. You cannot generate a new key right now.\n\n` +
                    `**ROMAN URDU:**\nAapke paas pehle se active key maujood hai. Aap nayi key generate nahi kar sakte.\n\n` +
                    `🔑 **Your Existing Key (Aapki Old Key):**\n\`\`\`${result.key}\`\`\``
                )
                .addFields(
                    { name: '⏳ Expiration / Time Remaining', value: `\`${result.hoursLeft} Hours\` left before you can claim a new key.`, inline: false }
                )
                .setFooter({ text: 'If you forgot your key, copy it from above! / Agar key bhool gaye the to upar se copy kar lein.' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            // NEW KEY GENERATED
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ New Access Key Generated!')
                .setDescription(
                    `**ENGLISH:**\nYour 3-day access key has been successfully created.\n\n` +
                    `**ROMAN URDU:**\nAapki 3-day access key successfully ban gayi hai.\n\n` +
                    `🔑 **Your Access Key:**\n\`\`\`${result.key}\`\`\``
                )
                .addFields(
                    { name: '⏳ Validity Period', value: `Valid for **72 Hours (3 Days)**.`, inline: false }
                )
                .setFooter({ text: 'Do not share your key with anyone. / Apni key kisi ke sath share mat karein.' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
