// ==========================================
// GRANDHACKS BOT - CLEAN VERSION (COMPLETE)
// ==========================================

const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

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
    console.log(`🤖 Logged in successfully as ${client.user.tag}! GrandHacks system online.`);

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

client.on('interactionCreate', async interaction => {
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

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Prefix Commands Handling
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const content = message.content;

    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ Please mention a valid member to kick!');
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await target.kick(reason);
            message.channel.send(`👢 Successfully kicked **${target.user.tag}**. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to kick this user.');
        }
    }

    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ Please mention a valid member to ban!');
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await target.ban({ reason });
            message.channel.send(`🔨 Successfully banned **${target.user.tag}**. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to ban this user.');
        }
    }

    if (command === 'unban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const userId = args[0];
        if (!userId) return message.reply('❌ Please provide a valid user ID to unban!');
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await message.guild.members.unban(userId, reason);
            message.channel.send(`✅ Successfully unbanned user ID: \`${userId}\`. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to unban this user (Check ID).');
        }
    }

    if (command === 'timeout' || command === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const target = message.mentions.members.first();
        const minutes = parseInt(args[1]);
        if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user <minutes>`');
        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            await target.timeout(minutes * 60 * 1000, reason);
            message.channel.send(`🔇 Successfully timed out **${target.user.tag}** for **${minutes}** minutes.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to timeout this user.');
        }
    }

    if (command === 'clear') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) return message.reply('❌ Specify a number between 1 and 100.');

        try {
            message.delete().catch(() => {});
            const deleted = await message.channel.bulkDelete(amount, true);
            const replyMsg = await message.channel.send(`🧹 Successfully cleared **${deleted.size}** messages.`);
            setTimeout(() => replyMsg.delete().catch(() => {}), 4000);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to clear messages.');
        }
    }

    if (command === 'say') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const sayMessage = args.join(' ');
        if (!sayMessage) return message.reply('❌ Please provide a message.');
        message.delete().catch(() => {});
        message.channel.send(sayMessage);
    }

    if (command === 'avatar' || command === 'pfp') {
        const target = message.mentions.users.first() || message.author;
        const avatarEmbed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle(`${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }))
            .setFooter({ text: `Requested by ${message.author.tag}` });
        message.channel.send({ embeds: [avatarEmbed] });
    }

    if (content === '!grandhackyt') {
        message.channel.send('🔴 Official GrandHackYT Gaming Channel: https://www.youtube.com/@grandhacks-l7j');
    }
    if (content === '!ping') {
        message.channel.send(`🏓 Pong! Latency is \`${client.ws.ping}ms\`.`);
    }
});

// Welcome Event (Embed + Member Count)
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID; 
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('👋 Welcome to GrandHacks!')
            .setDescription(`Hey ${member}, welcome to the family! Aaja maidan mein, maza aayega! 🚀`)
            .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}`, inline: true })
            .setThumbnail(member.user.displayAvatarURL());

        channel.send({ content: `${member}`, embeds: [embed] });
    } catch (error) {
        console.log('Welcome error: ', error);
    }
});

// Leave Event (Sad Embed + Member Count)
client.on('guildMemberRemove', async (member) => {
    const channelId = process.env.LEAVE_CHANNEL_ID; 
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        const embed = new EmbedBuilder()
            .setColor('#ff4d4d')
            .setTitle('😢 Member Left')
            .setDescription(`Alvida **${member.user.tag}**, humein dukh hai aap chale gaye! 🥀`)
            .addFields({ name: '📊 Remaining Members', value: `${member.guild.memberCount}`, inline: true })
            .setThumbnail(member.user.displayAvatarURL());

        channel.send({ embeds: [embed] });
    } catch (error) {
        console.log('Leave error: ', error);
    }
});

client.login(process.env.TOKEN);
                                                            
