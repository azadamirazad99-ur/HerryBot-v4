// ===================================================
// HERRY HACKS BOT - FULL COMPLETE INDEX.JS
// ===================================================

const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Collection, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField, 
    ChannelType,
    REST,
    Routes
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

client.commands = new Collection();
const PREFIX = '!';

// ---------------------------------------------------
// 1. LOAD SLASH COMMANDS FROM FOLDER
// ---------------------------------------------------
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }
}

// ---------------------------------------------------
// 2. BOT READY & SLASH COMMAND REGISTRATION
// ---------------------------------------------------
client.once('ready', async () => {
    console.log(`✅ [HERRY BOT] Logged in as ${client.user.tag}`);
    client.user.setActivity('HerryHacks VIP | /ticketsetup', { type: 3 });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);

    try {
        console.log('🔄 Registering Slash Commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ All Slash Commands Registered Successfully!');
    } catch (error) {
        console.error('❌ Slash Command Registration Error:', error);
    }
});

// ---------------------------------------------------
// 3. WELCOME & LEAVE EVENTS
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
        .setDescription(`**${member.user.tag}** left the server.`)
        .setColor('#FF0000')
        .setTimestamp();

    channel.send({ embeds: [leaveEmbed] });
});

// ---------------------------------------------------
// 4. MAIN INTERACTION HANDLER (COMMANDS & BUTTONS)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {
    
    // Slash Command Execution
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Command execute karne me error aaya!', ephemeral: true });
        }
    }

    // Ticket Buttons Action
    if (interaction.isButton()) {

        // Open Ticket Action
        if (interaction.customId === 'create_ticket') {
            await interaction.deferReply({ ephemeral: true });

            const cleanName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const existingChannel = interaction.guild.channels.cache.find(c => c.name === cleanName);

            if (existingChannel) {
                return interaction.editReply({ content: `❌ Aapka ticket pehle se open hai: ${existingChannel}` });
            }

            try {
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
                    name: cleanName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: permissionOverwrites
                };

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
                    .setDescription(`Welcome ${interaction.user}!\nApna masla yahan likhein, Staff jald reply karega.`)
                    .setColor('#00ffcc')
                    .setTimestamp();

                await ticketChannel.send({ content: `${interaction.user}`, embeds: [ticketEmbed], components: [closeBtn] });
                await interaction.editReply({ content: `✅ Ticket ban gaya hai: ${ticketChannel}` });

            } catch (err) {
                console.error("Ticket Creation Error:", err);
                await interaction.editReply({ content: '❌ Ticket create nahi ho saka! Check karein ki **HerryBot** Role Server Settings me sabse UPAR ho aur Administrator permission mili ho.' });
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
// 5. LEGACY/MODERATION COMMANDS
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
    }
});

// ---------------------------------------------------
// 6. LOGIN
// ---------------------------------------------------
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
