const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkmembers')
        .setDescription('Checks common members between HerryHacks and current server')
        .setIntegrationTypes([0, 1]) // 0: Guild Install, 1: User Install
        .setContexts([0, 1, 2]), // 0: Guild, 1: Bot DM, 2: Private Channel

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Teri Server ID (HerryHacks)
        const HERRY_GUILD_ID = '1529467083962843186'; 

        // 1. Force Fetch HerryHacks Server
        let herryGuild;
        try {
            herryGuild = await interaction.client.guilds.fetch(HERRY_GUILD_ID);
        } catch (error) {
            return interaction.editReply({ 
                content: `❌ HerryHacks Server API se fetch nahi ho saka! Check karo ki Bot Server ID \`${HERRY_GUILD_ID}\` me present hai ya nahi.` 
            });
        }

        // 2. Fetch HerryHacks Members
        let herryMembers;
        try {
            herryMembers = await herryGuild.members.fetch();
        } catch (e) {
            return interaction.editReply({ 
                content: '❌ HerryHacks ke members ka data fetch karne me error aaya! Bot ko `GUILD_MEMBERS` intent enable hona chahiye.' 
            });
        }

        // 3. Current Server Check (Jahan Command Run Kar Rahe Ho)
        const currentGuild = interaction.guild;
        if (!currentGuild) {
            return interaction.editReply({ content: '❌ Ye command kisi server ke chat me chalao!' });
        }

        // 4. Current Server Members Fetching
        let currentMembers;
        try {
            currentMembers = await currentGuild.members.fetch();
        } catch (e) {
            return interaction.editReply({ 
                content: `⚠️ **Discord API Restriction:** Bot is server (${currentGuild.name}) ka member nahi hai, is waja se Discord ne is server ki member list dene se block kar diya!` 
            });
        }

        // 5. Matching Common Members
        const commonMembers = [];
        currentMembers.forEach(member => {
            if (!member.user.bot && herryMembers.has(member.id)) {
                commonMembers.push(member);
            }
        });

        if (commonMembers.length === 0) {
            return interaction.editReply({ content: `✅ **${currentGuild.name}** me HerryHacks ka koi common member nahi mila.` });
        }

        // 6. Format Result Output
        const tags = commonMembers.map(m => `• <@${m.id}> (\`${m.user.tag}\` | ID: \`${m.id}\`)`).slice(0, 35).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🔍 Common Members Found: ${commonMembers.length}`)
            .setDescription(`**HerryHacks** aur **${currentGuild.name}** me ye members common hain:\n\n${tags}`)
            .setColor('#FF0055')
            .setFooter({ text: 'Only visible to you (Ephemeral)' })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
