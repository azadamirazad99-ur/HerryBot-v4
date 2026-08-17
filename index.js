// ==========================================
// HERRYHACKS BOT - GRAND MOBILE RP SPECIALIZED INDEX
// ==========================================

const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();
const commands = [];

// Command Handler Setup
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

client.once('ready', async () => {
    console.log(`🤖 Logged in successfully as ${client.user.tag}! HerryHacks system online.`);

    if (!process.env.TOKEN || !process.env.CLIENT_ID) {
        console.error("❌ TOKEN or CLIENT_ID is missing in Railway Variables!");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('🔄 Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error("Slash Command Error:", error);
    }
});

// Ticket Button System
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
            const guild = interaction.guild;
            const rawCategoryId = process.env.TICKET_CATEGORY_ID;
            const categoryId = (rawCategoryId && rawCategoryId.length > 10) ? rawCategoryId : null;
            const staffRoleId = process.env.STAFF_ROLE_ID;

            try {
                const permissionOverwrites = [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ];

                if (staffRoleId && staffRoleId.length > 10) {
                    permissionOverwrites.push({
                        id: staffRoleId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    });
                }

                const channelOptions = {
                    name: `ticket-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: permissionOverwrites,
                };

                if (categoryId) {
                    channelOptions.parent = categoryId;
                }

                const channel = await guild.channels.create(channelOptions);

                const embed = new EmbedBuilder()
                    .setColor('#00ffcc')
                    .setTitle('🎫 Support Ticket')
                    .setDescription(`Hello ${interaction.user}, support team jald hi yahan aayegi. Apni problem batayein.`);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
                await interaction.reply({ content: `✅ Aapka ticket ban gaya hai: ${channel}`, ephemeral: true });
            } catch (error) {
                console.error("Ticket Creation Error:", error);
                await interaction.reply({ content: `❌ Ticket banane mein error aaya! (${error.message})`, ephemeral: true });
            }
        }

        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Ticket 5 seconds mein band ho raha hai...' });
            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error("Interaction Error:", error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Error executing command!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Error executing command!', ephemeral: true });
        }
    }
});

// Message Handling & AI Assistant
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // ==========================================
    // OPENROUTER AI SYSTEM (GRAND MOBILE RP ONLY)
    // ==========================================
    if (message.mentions.has(client.user)) {
        try {
            await message.channel.sendTyping();
            const userQuery = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();

            const ownerId = process.env.OWNER_ID;
            const isOwner = message.author.id === ownerId;

            const SYSTEM_PROMPT = `
You are HerryBot, the official assistant dedicated ONLY to Grand Mobile RP and HerryHacks server.
CRITICAL RULES:
1. STRICTLY talk only about Grand Mobile RP. If the user asks about Roblox, Free Fire, or any other game, reject politely and say you only support Grand Mobile RP.
2. DO NOT output long programming code blocks or raw scripts. Instead, provide text guidance, options, and direct solutions for Grand Mobile RP Lua script features (teleport, auto-farm, features usage).
3. If users ask for Russian Lua script help/translation, translate Russian text to Urdu/English and explain what the script options do.
4. If users ask for cheat/hack links or downloads, direct them to our server's download channels.
5. Speak in English if asked in English, or in friendly Roman Urdu if asked in Desi language.
${isOwner ? "6. ALWAYS address the user as 'Boss Herry' or 'Sir'." : "6. Be helpful and direct with members."}
            `;

            const apiKey = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : '';

            if (!apiKey) {
                return message.reply("❌ `OPENROUTER_API_KEY` missing hai variables me!");
            }

            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'openrouter/auto',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userQuery || 'Hello' }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://railway.app',
                    'X-Title': 'HerryHacks Bot'
                }
            });

            const replyText = response.data?.choices?.[0]?.message?.content;
            if (replyText) {
                await message.reply(replyText.length > 2000 ? replyText.substring(0, 1995) + '...' : replyText);
            } else {
                await message.reply("❌ AI se response nahi aaya.");
            }
        } catch (error) {
            console.error("AI Error Details:", error.response?.data || error.message);
            await message.reply("❌ Error processing request.");
        }
        return;
    }

    const content = message.content.trim();

    // DOT COMMANDS (.kick, .ban, .unban)
    if (content.startsWith('.')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await target.kick(reason); message.channel.send(`👢 Kicked **${target.user.tag}**. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed.'); }
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await target.ban({ reason }); message.channel.send(`🔨 Banned **${target.user.tag}**. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed.'); }
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission.');
            const userId = args[0];
            if (!userId) return message.reply('❌ Provide a valid ID!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await message.guild.members.unban(userId, reason); message.channel.send(`✅ Unbanned ID: \`${userId}\`. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed.'); }
        }
    }

    // EXCLAMATION COMMANDS (!timeout, !rto, !clear, !say, !avatar, !pfp, !HerryHacksyt, !ping)
    if (content.startsWith('!')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user <minutes>`');
            const reason = args.slice(2).join(' ') || 'No reason provided';
            try { await target.timeout(minutes * 60 * 1000, reason); message.channel.send(`🔇 Timed out **${target.user.tag}** for **${minutes}** min.`); } catch (e) { message.channel.send('❌ Failed.'); }
        }

        if (command === 'rto') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member!');
            try { await target.timeout(null); message.channel.send(`🔊 Removed timeout from **${target.user.tag}**.`); } catch (e) { message.channel.send('❌ Failed to remove timeout.'); }
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ Specify 1-100.');
            try { message.delete(); const deleted = await message.channel.bulkDelete(amount, true); const r = await message.channel.send(`🧹 Cleared **${deleted.size}** msgs.`); setTimeout(() => r.delete(), 4000); } catch (e) { message.channel.send('❌ Failed.'); }
        }

        if (command === 'say') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const sayMessage = args.join(' ');
            if (!sayMessage) return message.reply('❌ Provide a message.');
            message.delete(); message.channel.send(sayMessage);
        }

        if (command === 'avatar' || command === 'pfp') {
            const target = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder().setColor('#00ffcc').setTitle(`${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 1024, dynamic: true }));
            message.channel.send({ embeds: [embed] });
        }

        if (content === '!HerryHacksyt') message.channel.send('🔴 Official: https://www.youtube.com/@grandhacks-l7j');
        if (content === '!ping') message.channel.send(`🏓 Pong! \`${client.ws.ping}ms\`.`);
    }
});

// Welcome Event
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🚨 Welcome To HerryHacks Server 🚨')
            .setDescription(`Swagat hai ${member}!\n\nGrand Mobile RP scripts, Russian translation, ya support ke liye bot ko mention karein.`)
            .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}`, inline: true })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'HerryHacks Community System' });

        channel.send({ content: ` **WELCOME:** ${member}`, embeds: [embed] });
    }
});

// Leave Event
client.on('guildMemberRemove', async (member) => {
    let channelId = process.env.LEAVE_CHANNEL_ID;
    const configPath = path.join(__dirname, 'config.json');
    if (!channelId && fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            channelId = config.leaveChannelId;
        } catch (e) { console.error(e); }
    }

    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('#ff4d4d')
        .setTitle('🚪 Player Left')
        .setDescription(`**${member.user.tag}** left the server. Good Bye 👋`)
        .addFields({ name: '📊 Remaining Members', value: `${member.guild.memberCount}`, inline: true })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'HerryHacks Community System' });

    channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);
                                                   
