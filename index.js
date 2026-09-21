// ===================================================
// HERRY HACKS BOT - FULL COMMAND HANDLER SYSTEM
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
    Collection
} = require('discord.js');
const fs = require('fs');
const path = require('path');
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

// Collections
client.commands = new Collection();
const PREFIX = '!';

// ---------------------------------------------------
// 1. COMMAND HANDLER (READ COMMANDS FOLDER)
// ---------------------------------------------------
const slashCommandsArray = [];
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            slashCommandsArray.push(command.data.toJSON());
            console.log(`📁 Loaded Slash Command: ${command.data.name}`);
        } else {
            console.log(`⚠️ [WARNING] The command at ${filePath} is missing "data" or "execute" property.`);
        }
    }
} else {
    console.log(`⚠️ 'commands' folder not found! Creating 'commands' directory...`);
    fs.mkdirSync(commandsPath);
}

// ---------------------------------------------------
// 2. BOT READY & REGISTER SLASH COMMANDS
// ---------------------------------------------------
client.once('ready', async () => {
    console.log(`✅ [HERRY BOT] Connected as ${client.user.tag}`);
    client.user.setActivity('HerryHacks VIP | !help', { type: 3 });

    // Register Slash Commands globally
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);
    try {
        console.log('🔄 Registering Slash Commands to Discord...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommandsArray }
        );
        console.log(`✅ Successfully registered ${slashCommandsArray.length} Slash Commands!`);
    } catch (error) {
        console.error('❌ Slash Command Registration Error:', error);
    }
});

// ---------------------------------------------------
// 3. WELCOME & LEAVE SYSTEM
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
// 4. INTERACTION EVENT (COMMANDS + BUTTONS)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {

    // --- A. EXECUTE SLASH COMMANDS FROM FOLDER ---
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Command execute karne me error aaya!', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Command execute karne me error aaya!', ephemeral: true });
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

    // GetKey Channel Auto-Delete & DM Warning
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

    // Exclamation Commands
    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ticketsetup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Keval Admin hi ticket panel setup kar sakta he!');
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
    }
});

// Bot Login
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
