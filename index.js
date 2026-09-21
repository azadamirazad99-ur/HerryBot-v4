
// ===================================================
// HERRY HACKS BOT - FULL INTEGRATED SYSTEM
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

// Settings & Config
const PREFIX = '!';

// ---------------------------------------------------
// 1. REGISTER SLASH COMMANDS & READY EVENT
// ---------------------------------------------------
const commands = [
    new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your VIP Script Access Key')
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`✅ [HERRY BOT] Connected as ${client.user.tag}`);
    client.user.setActivity('HerryHacks VIP | !help', { type: 3 });

    // Automatically Register /getkey Slash Command
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);
    try {
        console.log('🔄 Registering Slash Commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Slash Commands Registered Successfully!');
    } catch (error) {
        console.error('❌ Slash Command Registration Error:', error);
    }
});

// ---------------------------------------------------
// 2. WELCOME SYSTEM
// ---------------------------------------------------
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('👑 Welcome to HerryHacks Official! 👑')
        .setDescription(`Hey ${member}, welcome to the server!\n\n🔑 Check rules and enjoy your stay!`)
        .setColor('#00FF00')
        .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}` })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'HerryHacks Community' })
        .setTimestamp();

    channel.send({ content: `👋 Welcome ${member}!`, embeds: [welcomeEmbed] });
});

// ---------------------------------------------------
// 3. LEAVE SYSTEM
// ---------------------------------------------------
client.on('guildMemberRemove', async (member) => {
    const channelId = process.env.LEAVE_CHANNEL_ID;
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const leaveEmbed = new EmbedBuilder()
        .setTitle('👋 Member Left')
        .setDescription(`**${member.user.tag}** has left the server.`)
        .setColor('#FF0000')
        .addFields({ name: '📊 Remaining Members', value: `${member.guild.memberCount}` })
        .setTimestamp();

    channel.send({ embeds: [leaveEmbed] });
});

// ---------------------------------------------------
// 4. INTERACTION EVENT (GETKEY SLASH COMMAND + TICKETS)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {

    // --- A. /GETKEY SLASH COMMAND ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'getkey') {
            try {
                // Instantly acknowledge interaction to prevent "Application didn't respond" error
                await interaction.deferReply({ ephemeral: true });

                // Dynamic Key Generation / Response
                const userKey = `HERRY-VIP-${interaction.user.id.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

                const keyEmbed = new EmbedBuilder()
                    .setTitle('🔑 HerryHacks Script VIP Key')
                    .setDescription(`Hello ${interaction.user}, here is your script access key:\n\n\`\`\`${userKey}\`\`\``)
                    .setColor('#00FF00')
                    .addFields(
                        { name: '📌 Note', value: 'This key is bound to your account. Do not share it with anyone.' }
                    )
                    .setFooter({ text: 'HerryHacks Official Guard System' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [keyEmbed] });

            } catch (err) {
                console.error("GetKey Slash Command Error:", err);
                if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ Key generate karne me error aaya!' }).catch(() => {});
                }
            }
        }
        return;
    }

    // --- B. TICKET BUTTON ACTIONS ---
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-_]/g, '');
        
        const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketChannelName);
        if (existingChannel) {
            return interaction.reply({ content: `❌ Aapka ticket already open he: ${existingChannel}`, ephemeral: true });
        }

        try {
            const rawCategoryId = process.env.TICKET_CATEGORY_ID;
            const categoryId = (rawCategoryId && rawCategoryId.length > 5) ? rawCategoryId : null;
            const staffRoleId = process.env.STAFF_ROLE_ID;

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
            ];

            if (staffRoleId && staffRoleId.length > 10) {
                permissionOverwrites.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
            }

            const channelOptions = {
                name: ticketChannelName,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites
            };

            if (categoryId) channelOptions.parent = categoryId;

            const ticketChannel = await interaction.guild.channels.create(channelOptions);

            const closeBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            const ticketEmbed = new EmbedBuilder()
                .setTitle('🎫 Support Ticket')
                .setDescription(`Welcome ${interaction.user}!\nApna masla ya query yahan likhein. Admin/Staff jald hi reply karega.`)
                .setColor('#5865F2')
                .setTimestamp();

            await ticketChannel.send({ content: `${interaction.user}`, embeds: [ticketEmbed], components: [closeBtn] });
            await interaction.reply({ content: `✅ Ticket created successfully: ${ticketChannel}`, ephemeral: true });

        } catch (error) {
            console.error("Ticket Creation Error:", error);
            await interaction.reply({ content: `❌ Ticket banane me error aaya! Bot permissions check karein.`, ephemeral: true });
        }
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply('🔒 Closing this ticket in 5 seconds...');
        setTimeout(() => {
            if (interaction.channel) interaction.channel.delete().catch(() => {});
        }, 5000);
    }
});

// ---------------------------------------------------
// 5. MESSAGE EVENT (GETKEY AUTO-DELETE & PREFIX COMMANDS)
// ---------------------------------------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || message.interaction) return;

    // --- GETKEY CHANNEL AUTO-DELETE & DM WARNING ---
    const rawGetKeyChannelId = process.env.GETKEY_CHANNEL_ID;
    const getKeyChannelId = rawGetKeyChannelId ? String(rawGetKeyChannelId).trim() : null;

    if (getKeyChannelId && String(message.channel.id) === getKeyChannelId) {
        setImmediate(async () => {
            try {
                if (message.deletable) {
                    await message.delete().catch(() => {});
                }

                await message.author.send(
                    "⚠️ **Warning:** Yahan Getkey Command ke ilava kuch or message mat send karo. Sirf /getkey Command chalao otherwise next time timeout!"
                ).catch(() => {});

            } catch (err) {
                console.error("❌ GetKey Filter Error:", err.message);
            }
        });

        return; 
    }

    // Dot Commands (.kick, .ban, .unban)
    if (message.content.startsWith('.')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member.');
            const reason = args.slice(1).join(' ') || 'No reason';
            try {
                await target.kick(reason);
                message.channel.send(`👞 **${target.user.tag}** was kicked!`);
            } catch (e) {}
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member.');
            const reason = args.slice(1).join(' ') || 'No reason';
            try {
                await target.ban({ reason });
                message.channel.send(`🔨 **${target.user.tag}** was banned!`);
            } catch (e) {}
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const userId = args[0];
            if (!userId) return message.reply('❌ Provide User ID.');
            try {
                await message.guild.members.unban(userId);
                message.channel.send(`✅ Unbanned User ID: **${userId}**`);
            } catch (e) {}
        }
    }

    // Exclamation Commands (!ticketsetup, !help, !ping, !clear, !timeout, !rta)
    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ticketsetup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Keyewal Admin hi ticket panel setup kar sakta he!');
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('📩 Open Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

            const setupEmbed = new EmbedBuilder()
                .setTitle('🎫 HerryHacks Support System')
                .setDescription('Staff ya Owner se kisi help ya script issue ke liye niche button par click karke ticket open karein.')
                .setColor('#0099FF');

            await message.channel.send({ embeds: [setupEmbed], components: [row] });
            return message.delete().catch(() => {});
        }

        if (command === 'help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('👑 Herry Bot Commands Panel')
                .setColor('#FFD700')
                .addFields(
                    { name: '/getkey', value: 'Generate VIP Script Access Key' },
                    { name: '!ticketsetup', value: 'Deploy ticket creation button (Admin Only)' },
                    { name: '!ping', value: 'Check bot latency' },
                    { name: '!clear [amount]', value: 'Delete bulk messages (1-100)' },
                    { name: '!timeout @user [mins]', value: 'Mute member' },
                    { name: '!rta @user', value: 'Remove timeout' },
                    { name: '.kick / .ban / .unban', value: 'Moderation commands' }
                );
            return message.reply({ embeds: [helpEmbed] });
        }

        if (command === 'ping') {
            return message.reply(`🏓 Pong! API Latency is **${client.ws.ping}ms**.`);
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ Specify 1-100 messages.');
            try {
                await message.delete().catch(() => {});
                const deleted = await message.channel.bulkDelete(amount, true);
                const r = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`);
                setTimeout(() => r.delete().catch(() => {}), 4000);
            } catch (e) {}
        }

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user 10`');
            try {
                await target.timeout(minutes * 60 * 1000);
                message.channel.send(`⏳ **${target.user.tag}** timed out for ${minutes} minutes.`);
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

// Bot Login
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
