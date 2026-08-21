// ==========================================
// HERRYHACKS BOT - FIXED SYSTEM & FILTERS
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
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();
const commands = [];

// Track message spamming: userId -> Array of timestamps
const userMessageMap = new Map();

// Slash Command Handler
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
    console.log(`🤖 Logged in successfully as ${client.user.tag}! HerryHacks Bot online.`);

    const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID || process.env['CLIENT ID'];

    if (!botToken || !clientId) {
        console.error("❌ TOKEN or CLIENT_ID missing in Railway Variables!");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(botToken);

    try {
        console.log('🔄 Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error("Slash Command Error:", error);
    }
});

// Ticket System Integration
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
                    .setDescription(`Welcome ${interaction.user}, your ticket has been created. State your issue and staff will assist you.`);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
                await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
            } catch (error) {
                console.error("Ticket Creation Error:", error);
                await interaction.reply({ content: `❌ Error creating ticket! (${error.message})`, ephemeral: true });
            }
        }

        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
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

// AI Response & Moderation Handler
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const lowerQuery = message.content.toLowerCase().trim();
    const isMentioned = message.mentions.has(client.user);

    const hackLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
    const setupLink = 'https://discord.com/channels/1529467083962843186/1529477486235226172';

    // 1. BAN CHECK: Kid / Bacha / Son
    const banKeywords = ["bacha", "bachha", "kid", "son", "beta", "pappu"];
    const matchesBan = banKeywords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(lowerQuery));

    if (matchesBan && isMentioned) {
        try {
            if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                await message.guild.members.ban(message.author.id, { reason: "By bot for a reason" });
                await message.channel.send(`🔨 Banned **${message.author.tag}**. Reason: By bot for a reason`);
                return;
            }
        } catch (e) {
            console.error("Ban Execution Error:", e.message);
        }
    }

    // 2. SPAM DETECTOR & ABUSE TIMEOUT
    const now = Date.now();
    const userTimestamps = userMessageMap.get(message.author.id) || [];
    userTimestamps.push(now);

    // Keep timestamps from last 5 seconds
    const recentMessages = userTimestamps.filter(time => now - time < 5000);
    userMessageMap.set(message.author.id, recentMessages);

    const badWords = ["mc", "bc", "bhenchod", "madarchod", "gandu", "chutiye", "bsdk", "bhosdike", "laude", "lode", "lodu", "randi", "harami"];
    const containsAbuse = badWords.some(word => lowerQuery.includes(word));

    if (recentMessages.length >= 5) {
        try {
            if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                if (containsAbuse) {
                    await message.delete().catch(() => {});
                    await message.member.timeout(3 * 24 * 60 * 60 * 1000, "Abusive Spamming Detected");
                    await message.channel.send(`🚨 ${message.author} ko **3 Days** ka Timeout de diya hai (Abusive Spam + Messages Deleted).`);
                    return;
                } else {
                    await message.member.timeout(1 * 24 * 60 * 60 * 1000, "Spamming Detected");
                    await message.channel.send(`⚠️ ${message.author} ko **1 Day** ka Timeout de diya hai (Spamming).`);
                    return;
                }
            }
        } catch (e) {
            console.error("Spam Timeout Error:", e.message);
        }
    }

    // 3. KEYWORD SPECIFIC AUTO-LINKS (Tag Ho ya Na Ho)
    const isHackRequest = ["lulubox", "devvir", "reversoqzz", "posya", "herryposya", "hack"].some(w => lowerQuery.includes(w));
    const isSetupRequest = ["setup", "guide", "setup guide", "kaise kare", "install"].some(w => lowerQuery.includes(w));

    if (isHackRequest) {
        return message.reply(`🔗 **All Hacks & Scripts Link:**\n${hackLink}`);
    }

    if (isSetupRequest) {
        return message.reply(`📖 **Setup Guide Link:**\n${setupLink}`);
    }

    // NOTE: Agar mention nahi kiya aur hack/setup query nahi hai toh bilkul ignore kar do
    if (!isMentioned) return;

    // 4. MENTIONED AI RESPONSE SYSTEM
    try {
        await message.channel.sendTyping();
        const cleanUserQuery = message.content.replace(/<@!?\d+>/g, '').trim();

        const ownerId = process.env.OWNER_ID;
        const isOwner = message.author.id === ownerId;

        let member = message.member;
        if (message.guild && (!member || !member.roles)) {
            try {
                member = await message.guild.members.fetch(message.author.id);
            } catch (e) {
                console.error("Fetch Member Error:", e);
            }
        }

        const adminRoleId = "1538952736169656330";
        const staffRoleId = process.env.STAFF_ROLE_ID;
        const adminIdsRaw = process.env.ADMIN_IDS || "";
        const adminIds = adminIdsRaw.split(',').map(id => id.trim());

        const hasAdminId = adminIds.includes(message.author.id);
        const hasAdminRole = member ? member.roles.cache.has(adminRoleId) : false;
        const hasStaffRole = (staffRoleId && member) ? member.roles.cache.has(staffRoleId) : false;
        const hasAdminPermission = member ? (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild) || member.permissions.has(PermissionFlagsBits.ModerateMembers)) : false;

        const isAdmin = hasAdminId || hasAdminRole || hasStaffRole || hasAdminPermission;

        let roleInstructions = "";
        if (isOwner) {
            roleInstructions = `User is OWNER (Herry). Give MAXIMUM RESPECT. Address as "Boss/Sir". Strictly NO abuses.`;
        } else if (isAdmin) {
            roleInstructions = `User is ADMIN/STAFF. Be polite. If they mess with you, do funny light roasting.`;
        } else {
            roleInstructions = `User is Member. IF BAKCHODI: Give funny light roasts and light humor. NO EXTREME ABUSE.`;
        }

        const systemPrompt = `You are HerryBot in HerryHacks Discord Server.

RULES:
${roleInstructions}

STRICT INSTRUCTIONS:
- ALWAYS use plain text in English alphabets (Roman Urdu / Hinglish).
- DO NOT use markdown code blocks or dark background formatting.
- Keep answers SHORT, FUNNY, and DIRECT.

HACK LINK: ${hackLink}
SETUP LINK: ${setupLink}`;

        let replyText = null;

        // GROQ FIRST
        const groqKey = (process.env.GROQ_API_KEY || '').trim();
        if (groqKey) {
            const groqModels = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"];
            for (const model of groqModels) {
                try {
                    const groqRes = await axios.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        {
                            model: model,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: cleanUserQuery || "Hello" }
                            ],
                            max_tokens: 180
                        },
                        {
                            headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
                            timeout: 6000
                        }
                    );

                    if (groqRes.data?.choices?.[0]?.message?.content) {
                        replyText = groqRes.data.choices[0].message.content.trim();
                        break;
                    }
                } catch (e) {
                    console.log(`Groq Error: ${e.message}`);
                }
            }
        }

        // OPENROUTER FALLBACK
        if (!replyText) {
            const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
            const openRouterModels = ["openrouter/free", "google/gemma-4-31b-it:free", "deepseek/deepseek-r1:free"];

            for (const model of openRouterModels) {
                try {
                    const headers = { "Content-Type": "application/json" };
                    if (openRouterKey) headers["Authorization"] = `Bearer ${openRouterKey}`;

                    const orRes = await axios.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        {
                            model: model,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: cleanUserQuery || "Hello" }
                            ],
                            max_tokens: 180
                        },
                        { headers: headers, timeout: 7000 }
                    );

                    if (orRes.data?.choices?.[0]?.message?.content) {
                        replyText = orRes.data.choices[0].message.content.trim();
                        break;
                    }
                } catch (e) {
                    console.log(`OpenRouter Error: ${e.message}`);
                }
            }
        }

        if (replyText) {
            // Clean markdown blocks to fix dark/black text formatting issue
            const cleanText = replyText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
            await message.reply(cleanText.length > 1900 ? cleanText.substring(0, 1900) + '...' : cleanText);
        } else {
            await message.reply("Abe thoda ruk, AI busy chal raha hai!");
        }

    } catch (error) {
        console.error("Main AI Handler Error:", error.message);
    }
});

// Moderation Commands (.kick, .ban, .unban)
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const content = message.content.trim();

    if (content.startsWith('.')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ No permission to kick members.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Please mention a member to kick.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { 
                await target.kick(reason); 
                message.channel.send(`👢 Kicked **${target.user.tag}**. Reason: ${reason}`); 
            } catch (e) { 
                message.channel.send('❌ Failed to kick user.'); 
            }
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission to ban members.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Please mention a member to ban.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { 
                await target.ban({ reason }); 
                message.channel.send(`🔨 Banned **${target.user.tag}**. Reason: ${reason}`); 
            } catch (e) { 
                message.channel.send('❌ Failed to ban user.'); 
            }
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission to unban members.');
            const userId = args[0];
            if (!userId) return message.reply('❌ Please provide a valid User ID.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { 
                await message.guild.members.unban(userId, reason); 
                message.channel.send(`✅ Unbanned ID: \`${userId}\`. Reason: ${reason}`); 
            } catch (e) { 
                message.channel.send('❌ Failed to unban user.'); 
            }
        }
    }

    // Utility Commands (!timeout, !rto, !clear, !say, !pfp)
    if (content.startsWith('!')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user <minutes>`');
            const reason = args.slice(2).join(' ') || 'No reason provided';
            try { 
                await target.timeout(minutes * 60 * 1000, reason); 
                message.channel.send(`🔇 Timed out **${target.user.tag}** for **${minutes}** minutes.`); 
            } catch (e) { 
                message.channel.send('❌ Failed to apply timeout.'); 
            }
        }

        if (command === 'rto') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a user to remove timeout.');
            try { 
                await target.timeout(null); 
                message.channel.send(`🔊 Removed timeout for **${target.user.tag}**.`); 
            } catch (e) { 
                message.channel.send('❌ Failed to remove timeout.'); 
            }
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ Enter a number between 1 and 100.');
            try { 
                message.delete(); 
                const deleted = await message.channel.bulkDelete(amount, true); 
                const r = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`); 
                setTimeout(() => r.delete(), 4000); 
            } catch (e) { 
                message.channel.send('❌ Failed to clear messages.'); 
            }
        }

        if (command === 'say') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const sayMessage = args.join(' ');
            if (!sayMessage) return message.reply('❌ Provide a message to say.');
            message.delete(); 
            message.channel.send(sayMessage);
        }

        if (command === 'avatar' || command === 'pfp') {
            const target = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
                .setColor('#00ffcc')
                .setTitle(`${target.username}'s Avatar`)
                .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }));
            message.channel.send({ embeds: [embed] });
        }

        if (content === '!HerryHacksyt') message.channel.send('🔴 Official YouTube Channel: https://www.youtube.com/@herryhacks-1');
        if (content === '!ping') message.channel.send(`🏓 Pong! \`${client.ws.ping}ms\``);
    }
});

// Member Join Events
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🚨 Welcome To HerryHacks Server 🚨')
            .setDescription(`Welcome ${member}!\n\nMention the bot for Grand Mobile RP scripts and tools information.`)
            .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}`, inline: true })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'HerryHacks Community System' });

        channel.send({ content: `👋 **WELCOME:** ${member}`, embeds: [embed] });
    }
});

client.on('guildMemberRemove', async (member) => {
    let channelId = process.env.LEAVE_CHANNEL_ID;
    const configPath = path.join(__dirname, 'config.json');
    if (!channelId && fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            channelId = config.leaveChannelId;
        } catch (e) { 
            console.error(e); 
        }
    }

    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('#ff4d4d')
        .setTitle('🚪 Member Left')
        .setDescription(`**${member.user.tag}** has left the server 👋`)
        .addFields({ name: '📊 Remaining Members', value: `${member.guild.memberCount}`, inline: true })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'HerryHacks Community System' });

    channel.send({ embeds: [embed] });
});

// Bot Login
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);

