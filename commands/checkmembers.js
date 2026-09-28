const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkmembers')
        .setDescription('Checks common members between HerryHacks and current server')
        .setIntegrationTypes([0, 1]) // 0: Guild Install, 1: User Install
        .setContexts([0, 1, 2]), // 0: Guild, 1: Bot DM, 2: Private Channel

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // HerryHacks Server ID
        const HERRY_GUILD_ID = '1379398921385672744'; 

        // 1. Force Fetch Server from API (Cache ka masla khatam)
        let herryGuild;
        try {
            herryGuild = await interaction.client.guilds.fetch(HERRY_GUILD_ID);
        } catch (error) {
            return interaction.editReply({ content: `❌ HerryHacks server fetch karne me error aaya! ID check kar: ${HERRY_GUILD_ID}` });
        }

        // 2. Fetch HerryHacks Members
        let herryMembers;
        try {
            herryMembers = await herryGuild.members.fetch();
        } catch (e) {
            return interaction.editReply({ content: '❌ HerryHacks ke members ka data nahi nikal saka.' });
        }

        // 3. Current Server Check
        const currentGuild = interaction.guild;
        if (!currentGuild) {
            return interaction.editReply({ content: '❌ Ye command kisi server ke chat me chalao, DM me nahi!' });
        }

        // 4. Fetch Current Server Members (Yahan wahi restriction aayegi agar bot added nahi he)
        let currentMembers;
        try {
            currentMembers = await currentGuild.members.fetch();
        } catch (e) {
            return interaction.editReply({ 
                content: `⚠️ Error: Bot ko is server (${currentGuild.name}) ke members list read karne ka access nahi hai (Discord Security).` 
            });
        }

        // 5. Comparison
        const commonMembers = [];
        currentMembers.forEach(member => {
            if (!member.user.bot && herryMembers.has(member.id)) {
                commonMembers.push(member);
            }
        });

        if (commonMembers.length === 0) {
            return interaction.editReply({ content: '✅ Is server me HerryHacks ka koi member nahi mila.' });
        }

        // Tags banana (Max 30 members warna limit cross ho jayegi)
        const tags = commonMembers.map(m => `• <@${m.id}> (${m.user.tag})`).slice(0, 30).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🔍 Common Members Found (${commonMembers.length})`)
            .setDescription(tags)
            .setColor('#FF0000');

        return interaction.editReply({ embeds: [embed] });
    }
};
