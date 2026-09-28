const { SlashCommandBuilder, IntegrationType, InteractionContextType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkmembers')
        .setDescription('Checks common members between HerryHacks and current server')
        // External User App Settings
        .setIntegrationTypes([IntegrationType.UserInstall, IntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // 1. HerryHacks Server ID (Jahan Bot present hai)
        const HERRY_GUILD_ID = process.env.GUILD_ID || '1379398921385672744'; 
        const herryGuild = interaction.client.guilds.cache.get(HERRY_GUILD_ID);

        if (!herryGuild) {
            return interaction.editReply({ content: '❌ HerryHacks server load nahi ho saka!' });
        }

        // 2. Fetch Members of HerryHacks
        let herryMembers;
        try {
            herryMembers = await herryGuild.members.fetch();
        } catch (e) {
            return interaction.editReply({ content: '❌ HerryHacks ke members fetch karne me error aaya.' });
        }

        // 3. Current Server (Where Command is Triggered)
        const currentGuild = interaction.guild;
        if (!currentGuild) {
            return interaction.editReply({ content: '❌ Ye command sirf kisi server ke andar chalayein!' });
        }

        // 4. Try Fetching Current Server Members
        let currentMembers;
        try {
            currentMembers = await currentGuild.members.fetch();
        } catch (e) {
            return interaction.editReply({ 
                content: '⚠️ **Discord Security Block:** Bot is server me added nahi hai, is waja se Discord API ne is server ke members ka data dene se deny kar diya!' 
            });
        }

        // 5. Compare Members
        const commonMembers = [];
        currentMembers.forEach(member => {
            if (!member.user.bot && herryMembers.has(member.id)) {
                commonMembers.push(member);
            }
        });

        if (commonMembers.length === 0) {
            return interaction.editReply({ content: '✅ Is server me koi common member nahi mila.' });
        }

        const tags = commonMembers.map(m => `• <@${m.id}> (${m.user.tag} - \`${m.id}\`)`).slice(0, 30).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🔍 Common Members Found (${commonMembers.length})`)
            .setDescription(tags)
            .setColor('#FF0000')
            .setFooter({ text: 'Only visible to you (Ephemeral)' });

        return interaction.editReply({ embeds: [embed] });
    }
};
