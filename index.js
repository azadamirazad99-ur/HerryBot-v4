
// ==========================================
// HERRYHACKS BOT - ADVANCED MODERATION & AI
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

// Ticket System & Command Interactions
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

// AI Response & Moderation Handler
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const lowerQuery = message.content.toLowerCase().trim();
    const isMentioned = message.mentions.has(client.user);
    const ownerId = process.env.OWNER_ID;
    const isOwner = ownerId ? (message.author.id === ownerId.trim()) : false;

    const scriptLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
    const setupLink = 'https://discord.com/channels/1529467083962843186/1529477486235226172';

    // 1. ABUSE TOWARDS HERRY -> INSTANT BAN
    const severeAbuses = ["maa", "behen", "maderchod", "bhenchod", "madarchod", "bsdk", "bhosdike", "mc", "bc"];
    const mentionsHerry = ["herry", "owner", "boss", "admin"].some(w => lowerQuery.includes(w));
    const containsSevereAbuse = severeAbuses.some(word => new RegExp(`\\b${word}\\b`, 'i').test(lowerQuery));

    if (mentionsHerry && containsSevereAbuse && !isOwner) {
        try {
            if (message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                await message.guild.members.ban(message.author.id, { reason: "Abusing Herry Sir / Owner" });
                await message.channel.send(`🔨 **${message.author.tag}** ko permanent ban kar diya gaya hai. Reason: Abusing Herry Sir.`);
                return;
            }
        } catch (e) {
            console.error("Herry Abuse Ban Error:", e.message);
        }
    }

    // 2. FAKE OWNER CLAIMS
    const fakeOwnerClaims = ["i am herry", "iam herry", "im herry", "i am owner", "main owner hu", "me owner hu", "iam owner", "im owner", "i am the owner", "main hu owner"];
    if (fakeOwnerClaims.some(phrase => lowerQuery.includes(phrase)) && !isOwner) {
        try {
            if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                await message.member.timeout(60 * 60 * 1000, "Fake Owner Claim");
                return message.reply("Mene detect krliya bsdk bhag yaha se 60m ka timeout ka maza le");
            }
        } catch (e) {
            console.error("Fake Owner Timeout Error:", e.message);
        }
    }

    // 3. COMPETITOR HACKS
    if (["adil", "yuvraj", "rudra"].some(c => lowerQuery.includes(c))) {
        return message.reply("Abe saale un 3rd class scammer logon ka naam mat le yahan! Un ke faltu aur nakli hacks use karke apna account ban karwana hai kya? Last warning hai, dubara un scammers ka naam mat lena!");
    }

    // 4. GC HACK SPECIFIC QUERY
    if (lowerQuery.includes("gc hack") || lowerQuery.includes("gchack")) {
        if (lowerQuery.includes("kab") || lowerQuery.includes("when") || lowerQuery.includes("make") || lowerQuery.includes("banega")) {
            return message.reply("We working on it. If we find Way to create Hack we will publish it free Asap!");
        }
        return message.reply("GC hack is Unavailable.");
    }

    // 5. BACHA / KID CALLING
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

    // 8. SPAM & REPEAT MESSAGE DETECTION
    const now = Date.now();
    const userHistory = userMessageHistory.get(message.author.id) || [];
    userHistory.push({ text: lowerQuery, time: now });
    const recentHistory = userHistory.filter(m => now - m.time < 10000);
    userMessageHistory.set(message.author.id, recentHistory);

    if (recentHistory.filter(m => m.text === lowerQuery).length >= 3 && !isOwner) {
        try {
            if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                if (containsSevereAbuse) {
                    await message.delete().catch(() => {});
                    await message.member.timeout(3 * 24 * 60 * 60 * 1000, "Abusive Repeat Spam");
                    return message.channel.send(`🚨 ${message.author} ne same gaali wale msg 3 baar repeat kiye. **3 Days Timeout** lag gaya.`);
                } else {
                    await message.member.timeout(1 * 24 * 60 * 60 * 1000, "Normal Message Repeat Spam");
                    return message.channel.send(`⚠️ ${message.author} ne same msg 3 baar repeat kiya. **1 Day Timeout** lag gaya.`);
                }
            }
        } catch (e) {
            console.error("Spam Handling Error:", e.message);
        }
    }

    if (!isMentioned) return;

    // 9. AI RESPONSE ENGINE (GROQ & OPENROUTER WITH FREE MODELS)
    try {
        await message.channel.sendTyping();
        const cleanUserQuery = message.content.replace(/<@!?\d+>/g, '').trim();

        const ownerPrompt = `You are HerryBot in HerryHacks Discord Server.
The user talking to you IS YOUR REAL OWNER AND BOSS (Herry Sir).
RULES FOR OWNER:
1. ALWAYS start your response with "Herry Sir," or "Boss,".
2. Show maximum respect, politeness, and obedience. Never roast or use slang.
3. Respond in short Roman Urdu or English.
4. NEVER write code block backticks (\`\`\`) or include thinking tags.`;

        const memberPrompt = `You are HerryBot in HerryHacks Discord Server.
The user talking to you is a normal member (NOT OWNER).
RULES FOR REGULAR MEMBERS:
1. Speak with extreme attitude, heavy Desi/Roman Urdu roasts, and slangs (bsdk, bhenchod, chutiye, saale).
2. Respond in short Roman Urdu or English.
3. NEVER write code block backticks (\`\`\`) or include thinking tags.`;

        const activePrompt = isOwner ? ownerPrompt : memberPrompt;
        let replyText = null;

        // 1. GROQ MODELS TRY
        const groqKey = (process.env.GROQ_API_KEY || '').trim();
        if (groqKey) {
            const groqModels = [
                "deepseek-r1-distill-llama-70b",
                "llama-3.3-70b-versatile",
                "llama4-scout",
                "qwen3-32b-instruct"
            ];

            for (const model of groqModels) {
                try {
                    const groqRes = await axios.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        {
                            model: model,
                            messages: [
                                { role: "system", content: activePrompt },
                                { role: "user", content: cleanUserQuery || "Hello" }
                            ],
                            max_tokens: 150
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
                    console.log(`Groq Model Failed (${model}): ${e.response ? e.response.status : e.message}`);
                }
            }
        }

        // 2. OPENROUTER FREE MODELS FALLBACK
        if (!replyText) {
            const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
            const openRouterModels = [
                "deepseek/deepseek-r1:free",
                "x-ai/grok-mini:free",
                "qwen/qwen3-coder:free",
                "meta-llama/llama-4-maverick:free",
                "thinkingmachines/inkling:free",
                "openrouter/free"
            ];

            for (const model of openRouterModels) {
                try {
                    const headers = { "Content-Type": "application/json" };
                    if (openRouterKey) headers["Authorization"] = `Bearer ${openRouterKey}`;

                    const orRes = await axios.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        {
                            model: model,
                            messages: [
                                { role: "system", content: activePrompt },
                                { role: "user", content: cleanUserQuery || "Hello" }
                            ],
                            max_tokens: 150
                        },
                        { headers: headers, timeout: 6000 }
                    );

                    if (orRes.data?.choices?.[0]?.message?.content) {
                        replyText = orRes.data.choices[0].message.content.trim();
                        break;
                    }
                } catch (e) {
                    console.log(`OpenRouter Model Failed (${model}): ${e.response ? e.response.status : e.message}`);
                }
            }
        }

        // HARD FALLBACK
        if (!replyText) {
            replyText = isOwner 
                ? "Herry Sir, aapka kya hukum hai?" 
                : "Abe saale kya bol raha hai saaf bol!";
        }

        // REMOVE <think> AND <thought> TAGS COMPLETELY
        let cleanText = replyText
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .replace(/`{1,3}[a-z]*\n?/gi, '')
            .replace(/`/g, '')
            .trim();

        if (isOwner && !cleanText.toLowerCase().startsWith("herry sir") && !cleanText.toLowerCase().startsWith("boss")) {
            cleanText = `Herry Sir, ${cleanText}`;
        }

        await message.reply(cleanText.length > 1900 ? cleanText.substring(0, 1900) + '...' : cleanText);

    } catch (error) {
        console.error("Main AI Handler Error:", error.message);
    }
});

// Moderation Commands (.kick, .ban, .unban)
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
            const embed = new EmbedBuilder().setColor('#00ffcc').setTitle(`${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 1024, dynamic: true }));
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
            .setColor('#00ffcc')
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
