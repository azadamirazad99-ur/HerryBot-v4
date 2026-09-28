const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkmembers')
        .setDescription('Checks common members between HerryHacks and current server')
        // Direct Enums Values (UserInstall: 1, GuildInstall: 0)
        .setIntegrationTypes([0, 1])
        // Direct Context Values (Guild: 0, BotDM: 1, PrivateChannel: 2)
        .setContexts([0, 1, 2]),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const HERRY_GUILD_ID = process.env.GUILD_ID || '1379398921385672744'; 
        const herryGuild = interaction.client.guilds.cache.get(HERRY_GUILD_ID);

        if (!herryGuild) {
            return interaction.editReply({ content: '❌ HerryHacks server load nahi ho saka!' });
        }

        let herryMembers;
        try {
            herryMembers = await herryGuild.members.fetch();
        } catch (e) {
            return interaction.editReply({ content: '❌ HerryHacks ke members fetch karne me error aaya.' });
        }

        const currentGuild = interaction.guild;
        if (!currentGuild) {
            return interaction.editReply({ content: '❌ Ye command sirf kisi server ke andar chalayein!' });
        }

        let currentMembers;
        try {
            currentMembers = await currentGuild.members.fetch();
        } catch (e) {
            return interaction.editReply({ 
                content: '⚠️ **Discord Security Block:** Bot is server me added nahi hai, is waja se Discord API ne is server ke members ka data dene se deny kar diya!' 
            });
        }

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
