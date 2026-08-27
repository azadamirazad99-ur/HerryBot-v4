// ==========================================
// HERRYHACKS BOT - FULL FEATURED CODE
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

// Track message history
const userMessageHistory = new Map();
const chatContextHistory = new Map();

// Dynamic Fallback Replies
const ownerFallbacks = [
    "Herry Sir, boliye kya karna hai?",
    "Boss, main online hu, command bataiye!",
    "Herry Sir, aaj kya plan hai server ka?",
    "Ji Boss, sun raha hu!"
];

const vipRespectFallbacks = [
    "Aapka welcome hai sir, bataiye kya madad karun?",
    "Ji respected member, main aapki service me hu.",
    "Bataiye sir, aapke liye kya script ya details chahiye?"
];

const bakchodiFallbacks = [
    "Abe saale mere se hi bakchodi kar raha hai?",
    "Tu kitna bhi VIP ban ja, bakchodi karega to dho daalunga!",
    "Chal chal ziada hero mat ban, sidha bol kya scene hai!",
    "Abe tu VIP role leke bakchodi kar raha hai? Baap ko mat sikhaye!"
];

const politeFallbacks = [
    "Haan bhai, kaise ho?",
    "Bolo brother, kya help chahiye?",
    "Haan ji, bataiye kya masla hai?",
    "Suno bhai, main yahin hu bolo."
];

const rudeFallbacks = [
    "Abe saale bol bhi ab kya tamasha hai!",
    "Bar bar tag kyu kar raha hai bsdk?",
    "Kaam bol apna, faltu me tag mat kar!",
    "Kya hai abe? Ek baar me bol jo bolna hai!"
];

function getRandomFallback(array) {
    return array[Math.floor(Math.random() * array.length)];
}

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

// Ticket System & Interaction Handler
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isButton()) {
            if (interaction.customId === 'create_ticket') {
                const guild = interaction.guild;
                const rawCategoryId = process.env.TICKET_CATEGORY_ID;
                const categoryId = (rawCategoryId && rawCategoryId.length > 10) ? rawCategoryId : null;
                const staffRoleId = process.env.STAFF_ROLE_ID;

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

                if (categoryId) channelOptions.parent = categoryId;

                const channel = await guild.channels.create(channelOptions);

                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
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
            }

            if (interaction.customId === 'close_ticket') {
                await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
                setTimeout(() => {
                    if (interaction.channel) interaction.channel.delete().catch(() => {});
                }, 5000);
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        await command.execute(interaction);
    } catch (error) {
        console.error("Interaction Error:", error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Error executing command!', ephemeral: true }).catch(() => {});
        } else {
            await interaction.reply({ content: '❌ Error executing command!', ephemeral: true }).catch(() => {});
        }
    }
});

// Main AI & Auto-Moderation Engine
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const lowerQuery = message.content.toLowerCase().trim();
    const isMentioned = message.mentions.has(client.user);
    const ownerId = process.env.OWNER_ID;
    const isOwner = ownerId ? (message.author.id === ownerId.trim()) : false;

    // Special VIP Roles Check
    const vipRoleIds = ['1529467733161283654', '1529467634956112083', '1529468137475543091'];
    const hasVipRole = message.member ? message.member.roles.cache.some(role => vipRoleIds.includes(role.id)) : false;

    // Bakchodi Detection Logic
    const bakchodiWords = ["bsdk", "saale", "chutiye", "bakchodi", "chut", "gaand", "gand", "scam", "scammer", "lodu", "gandu", "behen", "maa", "pagal", "chutiya", "lawde", "lode"];
    const isDoingBakchodi = bakchodiWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(lowerQuery));

    const scriptLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
    const setupLink = 'https://discord.com/channels/1529467083962843186/1529477486235226172';

    // 1. MOTHER/SISTER/BOT SEVERE ABUSE -> AUTO BAN
    const severeAbuses = ["maa", "behen", "behn", "maderchod", "bhenchod", "madarchod", "ami", "ammi", "mami", "chut", "gaand", "lund"];
    const containsSevereAbuse = severeAbuses.some(word => new RegExp(`\\b${word}\\b`, 'i').test(lowerQuery));

    if (containsSevereAbuse && !isOwner) {
        try {
            await message.delete().catch(() => {});
            if (message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                await message.guild.members.ban(message.author.id, { reason: "Abusing Mother/Sister/Severe Slang in Server" });
                return message.channel.send(`🔨 **${message.author.tag}** ko PERMANENT BAN kar diya gaya hai! Reason: Severe Abuse.`);
            }
        } catch (e) {
            console.error("Ban Execution Error:", e.message);
        }
    }

    // 2. FAKE OWNER CLAIMS -> 1 HOUR TIMEOUT
    const fakeOwnerClaims = ["i am herry", "iam herry", "im herry", "i am owner", "main owner hu", "me owner hu", "iam owner", "im owner", "i am the owner", "main hu owner"];
    if (fakeOwnerClaims.some(phrase => lowerQuery.includes(phrase)) && !isOwner) {
        try {
            if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                await message.member.timeout(60 * 60 * 1000, "Fake Owner Claim");
                return message.reply("Mene detect krliya bsdk bhag yaha se 60m ka timeout ka maza le!");
            }
        } catch (e) {
            console.error("Fake Owner Timeout Error:", e.message);
        }
    }

    // 3. COMPETITOR HACKS
    if (["adil", "yuvraj", "rudra"].some(c => lowerQuery.includes(c))) {
        return message.reply("Abe saale un 3rd class scammer logon ka naam mat le yahan! Un ke faltu aur nakli hacks use karke apna account ban karwana hai kya? Last warning hai!");
    }

    // 4. GC HACK SPECIFIC QUERY
    if (lowerQuery.includes("gc hack") || lowerQuery.includes("gchack")) {
        if (lowerQuery.includes("kab") || lowerQuery.includes("when") || lowerQuery.includes("make") || lowerQuery.includes("banega")) {
            return message.reply("We working on it. If we find Way to create Hack we will publish it free Asap!");
        }
        return message.reply("GC hack is Unavailable.");
    }

    // 5. BACHA / KID CALLING -> 3 DAYS TIMEOUT
    if (["bacha", "bachha", "kid", "pappu"].some(w => new RegExp(`\\b${w}\\b`, 'i').test(lowerQuery)) && (isMentioned || lowerQuery.includes("bot")) && !isOwner) {
        try {
            if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                await message.member.timeout(3 * 24 * 60 * 60 * 1000, "Calling someone/bot bacha or kid");
                return message.reply(`🚨 ${message.author} tu kisse bacha bol raha hai saale? Chal **3 Days Timeout** bhugat ab!`);
            }
        } catch (e) {
            console.error("Bacha Timeout Error:", e.message);
        }
    }

    // 6. OWNER QUERY CHECK
    if (["who is owner", "owner kon he", "owner kaun hai", "owner kon hai", "who is the owner"].some(w => lowerQuery.includes(w))) {
        return message.reply("👑 **Herry Sir** is the official owner of HerryHacks!");
    }

    // 7. SCRIPT & SETUP REQUESTS
    if (lowerQuery.includes("link") && ["reversoqzz", "lulubox", "devvir", "herryposya", "posya"].some(w => lowerQuery.includes(w))) {
        return message.reply(`🔗 **Official Script Link:**\n${scriptLink}`);
    }
    if (lowerQuery.includes("where is posya") || lowerQuery.includes("where is herryposya")) {
        return message.reply(`🔗 **HerryPosya Script Link:**\n${scriptLink}`);
    }
    if (["setup guide", "guide link", "kaise kare link", "install link"].some(w => lowerQuery.includes(w))) {
        return message.reply(`📖 **Setup Guide Link:**\n${setupLink}`);
    }

    // 8. SPAM DETECTION
    const now = Date.now();
    const userHistory = userMessageHistory.get(message.author.id) || [];
    userHistory.push({ text: lowerQuery, time: now });
    const recentHistory = userHistory.filter(m => now - m.time < 10000);
    userMessageHistory.set(message.author.id, recentHistory);

    if (recentHistory.filter(m => m.text === lowerQuery).length >= 3 && !isOwner) {
        try {
            if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                await message.member.timeout(1 * 24 * 60 * 60 * 1000, "Message Repeat Spam");
                return message.channel.send(`⚠️ ${message.author} ne same msg 3 baar repeat kiya. **1 Day Timeout** lag gaya.`);
            }
        } catch (e) {
            console.error("Spam Handling Error:", e.message);
        }
    }

    if (!isMentioned) return;

    // 9. DYNAMIC AI RESPONSE ENGINE
    try {
        await message.channel.sendTyping();
        const cleanUserQuery = message.content.replace(/<@!?\d+>/g, '').trim();

        const isPoliteUser = ["bhai", "sir", "bro", "dear", "pyaare", "pyaar", "respect", "ji", "please", "pls"].some(w => lowerQuery.includes(w));

        let activePrompt = "";

        if (isOwner) {
            activePrompt = `You are HerryBot in HerryHacks Server. The user is YOUR OWNER (Herry Sir). ALWAYS respond with highest respect starting with "Herry Sir," or "Boss,". Answer directly.`;
        } else if (hasVipRole) {
            if (isDoingBakchodi) {
                activePrompt = `You are HerryBot in HerryHacks Server. The user holds a VIP Role but IS DOING BAKCHODI / TAUNTING YOU. Forget respect, roast them back with high attitude, funny roasts, and mild slangs (bsdk, saale) in Desi Roman Urdu!`;
            } else {
                activePrompt = `You are HerryBot in HerryHacks Server. The user holds a SPECIAL VIP ROLE. Treat them with immense respect, politeness, and dignity in Roman Urdu or English.`;
            }
        } else if (isPoliteUser) {
            activePrompt = `You are HerryBot. User is asking politely. Be friendly and respectful in short Roman Urdu or English.`;
        } else {
            activePrompt = `You are HerryBot. User is a regular member. Speak with high attitude, short Desi Roman Urdu roasts, and mild slangs (bsdk, saale, chutiye)!`;
        }

        const userMemoryKey = `${message.channel.id}_${message.author.id}`;
        let previousHistory = chatContextHistory.get(userMemoryKey) || [];

        const messagesPayload = [
            { role: "system", content: activePrompt },
            ...previousHistory,
            { role: "user", content: cleanUserQuery || "Hello" }
        ];

        let replyText = null;

        // 1. GROQ TRY
        const groqKey = (process.env.GROQ_API_KEY || '').trim();
        if (groqKey) {
            const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
            for (const model of groqModels) {
                try {
                    const groqRes = await axios.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        {
                            model: model,
                            messages: messagesPayload,
                            max_tokens: 120,
                            temperature: 0.9,
                            frequency_penalty: 0.7
                        },
                        { headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" }, timeout: 6000 }
                    );
                    if (groqRes.data?.choices?.[0]?.message?.content) {
                        replyText = groqRes.data.choices[0].message.content.trim();
                        break;
                    }
                } catch (e) {
                    console.error("Groq Model Fail:", e.message);
                }
            }
        }

        // 2. OPENROUTER FALLBACK
        if (!replyText) {
            const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
            const openRouterModels = ["meta-llama/llama-3.3-70b-instruct:free", "x-ai/grok-mini:free"];

            for (const model of openRouterModels) {
                try {
                    const headers = { "Content-Type": "application/json" };
                    if (openRouterKey) headers["Authorization"] = `Bearer ${openRouterKey}`;

                    const orRes = await axios.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        {
                            model: model,
                            messages: messagesPayload,
                            max_tokens: 120,
                            temperature: 0.9
                        },
                        { headers: headers, timeout: 6000 }
                    );

                    if (orRes.data?.choices?.[0]?.message?.content) {
                        replyText = orRes.data.choices[0].message.content.trim();
                        break;
                    }
                } catch (e) {
                    console.error("OpenRouter Fail:", e.message);
                }
            }
        }

        // DYNAMIC HARD FALLBACK
        if (!replyText) {
            if (isOwner) replyText = getRandomFallback(ownerFallbacks);
            else if (hasVipRole && !isDoingBakchodi) replyText = getRandomFallback(vipRespectFallbacks);
            else if (hasVipRole && isDoingBakchodi) replyText = getRandomFallback(bakchodiFallbacks);
            else if (isPoliteUser) replyText = getRandomFallback(politeFallbacks);
            else replyText = getRandomFallback(rudeFallbacks);
        }

        let cleanText = replyText
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .replace(/`{1,3}[a-z]*\n?/gi, '')
            .replace(/`/g, '')
            .trim();

        if (isOwner && !cleanText.toLowerCase().startsWith("herry sir") && !cleanText.toLowerCase().startsWith("boss")) {
            cleanText = `Herry Sir, ${cleanText}`;
        }

        previousHistory.push({ role: "user", content: cleanUserQuery });
        previousHistory.push({ role: "assistant", content: cleanText });

        if (previousHistory.length > 6) {
            previousHistory = previousHistory.slice(-6);
        }
        chatContextHistory.set(userMemoryKey, previousHistory);

        await message.reply(cleanText.length > 1900 ? cleanText.substring(0, 1900) + '...' : cleanText);

    } catch (error) {
        console.error("Main AI Handler Error:", error.message);
    }
});

// Moderation Prefix Commands (.kick, .ban, .unban, !timeout, !rto, !clear, !avatar)
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    const content = message.content.trim();

    if (content.startsWith('.')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member.');
            const reason = args.slice(1).join(' ') || 'No reason';
            try { await target.kick(reason); message.channel.send(`👢 Kicked **${target.user.tag}**.`); } catch (e) { message.channel.send('❌ Error kicking user.'); }
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member.');
            const reason = args.slice(1).join(' ') || 'No reason';
            try { await target.ban({ reason }); message.channel.send(`🔨 Banned **${target.user.tag}**.`); } catch (e) { message.channel.send('❌ Error banning user.'); }
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission.');
            const userId = args[0];
            if (!userId) return message.reply('❌ Provide User ID.');
            try { await message.guild.members.unban(userId); message.channel.send(`✅ Unbanned ID: \`${userId}\``); } catch (e) { message.channel.send('❌ Error unbanning user.'); }
        }
    }

    if (content.startsWith('!')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user <minutes>`');
            try { await target.timeout(minutes * 60 * 1000); message.channel.send(`🔇 Timed out **${target.user.tag}** for ${minutes}m.`); } catch (e) { message.channel.send('❌ Timeout failed.'); }
        }

        if (command === 'rto') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention user.');
            try { await target.timeout(null); message.channel.send(`🔊 Removed timeout for **${target.user.tag}**.`); } catch (e) { message.channel.send('❌ Error.'); }
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ Enter number 1-100.');
            try { 
                await message.delete().catch(() => {});
                const deleted = await message.channel.bulkDelete(amount, true); 
                const r = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`); 
                setTimeout(() => r.delete().catch(() => {}), 4000); 
            } catch (e) { message.channel.send('❌ Error clearing.'); }
        }

        if (command === 'avatar' || command === 'pfp') {
            const target = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder().setColor('#FFD700').setTitle(`${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 1024, dynamic: true }));
            message.channel.send({ embeds: [embed] });
        }

        if (content === '!HerryHacksyt') message.channel.send('🔴 Official YouTube Channel: https://www.youtube.com/@herryhacks-1');
        if (content === '!ping') message.channel.send(`🏓 Pong! \`${client.ws.ping}ms\``);
    }
});

// Member Join/Leave Events
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🚨 Welcome To HerryHacks Server 🚨')
            .setDescription(`Welcome ${member}!\n\nMention the bot for Grand Mobile RP scripts and tools information.`)
            .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}`, inline: true })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
        channel.send({ content: `👋 **WELCOME:** ${member}`, embeds: [embed] });
    }
});

client.on('guildMemberRemove', async (member) => {
    const channelId = process.env.LEAVE_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#ff4d4d')
            .setTitle('🚪 Member Left')
            .setDescription(`**${member.user.tag}** has left the server 👋`)
            .addFields({ name: '📊 Remaining Members', value: `${member.guild.memberCount}`, inline: true });
        channel.send({ embeds: [embed] });
    }
});

// Bot Login
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
 
