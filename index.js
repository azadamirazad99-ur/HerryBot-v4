// ==========================================
// FRESH INDEX.JS FOR GRANDHACKS BOT (ALL-IN-ONE)
// ==========================================

const { Client, GatewayIntentBits, Collection, REST, Routes, AttachmentBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const Canvas = require('canvas');

// Bot Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Commands collection setup
client.commands = new Collection();
const commands = [];

// Commands folder handler
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
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
}

// Bot Ready Event & Slash Commands Deployment via Railway Variables
client.once('ready', async () => {
    console.log(`🤖 Logged in successfully as ${client.user.tag}! GrandHacks system online.`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('🔄 Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// ==========================================
// SLASH COMMAND INTERACTION HANDLER
// ==========================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ There was an error while executing this command!', ephemeral: true });
        }
    }
});

// ==========================================
// PREFIX COMMANDS HANDLER (!) — Kick, Ban, Timeout, Clear, Say, Avatar
// ==========================================
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. !kick @user [reason]
    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ Please mention a valid member to kick! Example: `!kick @user Spamming`');
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await target.kick(reason);
            message.channel.send(`👢 Successfully kicked **${target.user.tag}**. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to kick this user. Check role hierarchy permissions.');
        }
    }

    // 2. !ban @user [reason]
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ Please mention a valid member to ban! Example: `!ban @user Breaking rules`');
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await target.ban({ reason });
            message.channel.send(`🔨 Successfully banned **${target.user.tag}**. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to ban this user. Check role hierarchy permissions.');
        }
    }

    // 3. !timeout @user <minutes> [reason]
    if (command === 'timeout' || command === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const target = message.mentions.members.first();
        const minutes = parseInt(args[1]);
        if (!target) return message.reply('❌ Please mention a valid member! Example: `!timeout @user 10`');
        if (!minutes || isNaN(minutes)) return message.reply('❌ Please specify valid minutes! Example: `!timeout @user 10`');
        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            await target.timeout(minutes * 60 * 1000, reason);
            message.channel.send(`🔇 Successfully timed out **${target.user.tag}** for **${minutes}** minutes. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to timeout this user. Check role hierarchy permissions.');
        }
    }

    // 4. !clear <number>
    if (command === 'clear') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
            return message.reply('❌ Please specify a valid number between 1 and 100! Example: `!clear 10`');
        }

        try {
            message.delete().catch(() => {});
            const deleted = await message.channel.bulkDelete(amount, true);
            const replyMsg = await message.channel.send(`🧹 Successfully cleared **${deleted.size}** messages.`);
            setTimeout(() => replyMsg.delete().catch(() => {}), 4000);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Failed to clear messages (Messages older than 14 days cannot be deleted).');
        }
    }

    // 5. !say <message>
    if (command === 'say') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const sayMessage = args.join(' ');
        if (!sayMessage) return message.reply('❌ Please provide a message for the bot to say! Example: `!say Hello everyone`');

        message.delete().catch(() => {});
        message.channel.send(sayMessage);
    }

    // 6. !avatar [@user]
    if (command === 'avatar' || command === 'pfp') {
        const target = message.mentions.users.first() || message.author;
        const avatarEmbed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle(`${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }))
            .setFooter({ text: `Requested by ${message.author.tag}` });

        message.channel.send({ embeds: [avatarEmbed] });
    }

    // Extra utilities
    if (content === '!grandhackyt') {
        message.channel.send('🔴 Official GrandHackYT Gaming Channel: https://www.youtube.com/@grandhacks-l7j');
    }
    if (content === '!ping') {
        message.channel.send(`🏓 Pong! Latency is \`${client.ws.ping}ms\`.`);
    }
});

// ==========================================
// AUTOMATIC WELCOME CARD EVENT (guildMemberAdd)
// ==========================================
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID || 'APKE_WELCOME_CHANNEL_ID_YAHAN_DALEN'; 
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        const canvas = Canvas.createCanvas(1024, 500);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const avatarURL = member.guild.iconURL({ extension: 'png', size: 512 }) || 'https://i.imgur.com/AfFp7pu.png';
        const avatar = await Canvas.loadImage(avatarURL);

        ctx.save();
        ctx.beginPath();
        ctx.arc(512, 160, 90, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 422, 70, 180, 180);
        ctx.restore();

        ctx.font = 'bold 45px sans-serif';
        ctx.fillStyle = '#00ffcc';
        ctx.textAlign = 'center';
        ctx.fillText('GrandHacks Community', canvas.width / 2, 310);

        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`WELCOME, ${member.user.tag}!`, canvas.width / 2, 380);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Bhai ka swagat hai! Aaja maidan mein, maza aayega!', canvas.width / 2, 430);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });

        await channel.send({
            content: `🎉 Oye sab suno! ${member} bhai hamare server **GrandHacks** mein aa chuke hain! Dil se welcome hai bhai! 🚀`,
            files: [attachment]
        });

    } catch (error) {
        console.log('Welcome image error: ', error);
        await channel.send(`🎉 Welcome ${member} to **GrandHacks**! Server pe aane ke liye shukriya, enjoy your stay! 🚀`);
    }
});

// Bot Login via Railway Variable
client.login(process.env.TOKEN);
                
