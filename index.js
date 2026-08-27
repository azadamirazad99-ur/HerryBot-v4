// ===================================================
// HERRY HACKS BOT - ULTRA SAFE TICKET FIX
// ===================================================

const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField, 
    ChannelType,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

const PREFIX = '!';

// ---------------------------------------------------
// 1. REGISTER SLASH COMMANDS ON READY
// ---------------------------------------------------
client.once('ready', async () => {
    console.log(`✅ [HERRY BOT] Connected as ${client.user.tag}`);
    client.user.setActivity('HerryHacks VIP | /ticketsetup', { type: 3 });

    const slashCommands = [
        new SlashCommandBuilder()
            .setName('ticketsetup')
            .setDescription('Deploy support ticket panel (Admin Only)')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommands }
        );
        console.log('✅ Slash Commands Registered!');
    } catch (error) {
        console.error('❌ Slash Command Error:', error);
    }
});

// ---------------------------------------------------
// 2. WELCOME & LEAVE SYSTEM
// ---------------------------------------------------
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('👑 Welcome to HerryHacks Official! 👑')
        .setDescription(`Hey ${member}, welcome to the server!`)
        .setColor('#00FF00')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    channel.send({ content: `👋 Welcome ${member}!`, embeds: [welcomeEmbed] });
});

client.on('guildMemberRemove', async (member) => {
    const channelId = process.env.LEAVE_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const leaveEmbed = new EmbedBuilder()
        .setTitle('👋 Member Left')
        .setDescription(`**${member.user.tag}** left.`)
        .setColor('#FF0000')
        .setTimestamp();

    channel.send({ embeds: [leaveEmbed] });
});

// ---------------------------------------------------
// 3. INTERACTION HANDLER (SLASH + BUTTONS)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {

    // A. Slash Command /ticketsetup
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'ticketsetup') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Admin access required!', ephemeral: true });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('📩 Open Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

            const setupEmbed = new EmbedBuilder()
                .setTitle('🎫 HerryHacks Support Panel')
                .setDescription('Help ya query ke liye niche button par click karke ticket open karein.')
                .setColor('#0099FF');

            await interaction.channel.send({ embeds: [setupEmbed], components: [row] });
            return interaction.reply({ content: '✅ Panel deployed!', ephemeral: true });
        }
    }

    // B. Button Interactions
    if (interaction.isButton()) {
        
        // Open Ticket Action
        if (interaction.customId === 'create_ticket') {
            await interaction.deferReply({ ephemeral: true });

            const cleanUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
            const ticketChannelName = `ticket-${cleanUsername}`;
            
            const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketChannelName);
            if (existingChannel) {
                return interaction.editReply({ content: `❌ Aapka ticket pehle se open hai: ${existingChannel}` });
            }

            try {
                // Guaranteed Safe Overwrites
                const permissionOverwrites = [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
                    },
                    {
                        id: client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels]
                    }
                ];

                // Optional Staff Role Add
                const rawStaff = process.env.STAFF_ROLE_ID;
                if (rawStaff && rawStaff.trim().length >= 17) {
                    const cleanStaffId = rawStaff.trim();
                    if (interaction.guild.roles.cache.has(cleanStaffId)) {
                        permissionOverwrites.push({
                            id: cleanStaffId,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        });
                    }
                }

                const channelOptions = {
                    name: ticketChannelName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: permissionOverwrites
                };

                // Optional Category Add
                const rawCat = process.env.TICKET_CATEGORY_ID;
                if (rawCat && rawCat.trim().length >= 17) {
                    const cleanCatId = rawCat.trim();
                    if (interaction.guild.channels.cache.has(cleanCatId)) {
                        channelOptions.parent = cleanCatId;
                    }
                }

                const ticketChannel = await interaction.guild.channels.create(channelOptions);

                const closeBtn = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                const ticketEmbed = new EmbedBuilder()
                    .setTitle('🎫 Support Ticket')
                    .setDescription(`Welcome ${interaction.user}!\nApna masla yahan likhein. Staff jald reply karega.`)
                    .setColor('#5865F2')
                    .setTimestamp();

                await ticketChannel.send({ content: `${interaction.user}`, embeds: [ticketEmbed], components: [closeBtn] });
                await interaction.editReply({ content: `✅ Ticket create ho gaya: ${ticketChannel}` });

            } catch (error) {
                console.error("CRITICAL TICKET ERROR:", error);
                await interaction.editReply({ content: `❌ Bot ke paas Server me 'Manage Channels' permission nahi hai. Developer settings check karein.` });
            }
        }

        // Close Ticket Action
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Ticket 5 seconds me delete ho raha hai...', ephemeral: true });
            setTimeout(() => {
                if (interaction.channel) interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }
});

// ---------------------------------------------------
// 4. MODERATION & UTILITY COMMANDS
// ---------------------------------------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('.')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Member mention karein.');
            try {
                await target.kick();
                message.channel.send(`👞 **${target.user.tag}** kick ho gaya.`);
            } catch (e) {}
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Member mention karein.');
            try {
                await target.ban();
                message.channel.send(`🔨 **${target.user.tag}** ban ho gaya.`);
            } catch (e) {}
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const userId = args[0];
            if (!userId) return message.reply('❌ User ID dein.');
            try {
                await message.guild.members.unban(userId);
                message.channel.send(`✅ ID: **${userId}** unban ho gaya.`);
            } catch (e) {}
        }
    }

    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ping') return message.reply(`🏓 Latency: **${client.ws.ping}ms**`);

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ 1-100 number dein.');
            try {
                await message.delete().catch(() => {});
                const deleted = await message.channel.bulkDelete(amount, true);
                const msg = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`);
                setTimeout(() => msg.delete().catch(() => {}), 4000);
            } catch (e) {}
        }

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes) return message.reply('❌ Usage: `!timeout @user 10`');
            try {
                await target.timeout(minutes * 60 * 1000);
                message.channel.send(`⏳ **${target.user.tag}** timed out for ${minutes} mins.`);
            } catch (e) {}
        }

        if (command === 'rta') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention user.');
            try {
                await target.timeout(null);
                message.channel.send(`✅ Timeout removed for **${target.user.tag}**.`);
            } catch (e) {}
        }
    }
});

const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
