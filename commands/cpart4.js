// ==========================================
// PART 4: 10 MORE NEW COMMANDS IN A SINGLE CODE BLOCK
// ==========================================

// 1. Tech Fact (techfact.js)
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('techfact')
        .setDescription('Sends a random technology trivia fact.'),
    async execute(interaction) {
        const facts = [
            "The first computer mouse was invented by Doug Engelbart in 1964 and was made of wood.",
            "The first-ever email was sent by Ray Tomlinson to himself in 1971.",
            "More than 80% of all emails sent daily are spam."
        ];
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(`💻 **Tech Fact:** ${fact}`);
    },
};

// 2. Space Fact (spacefact.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('spacefact')
        .setDescription('Sends a cool fact about outer space.'),
    async execute(interaction) {
        const facts = [
            "One day on Venus is longer than one year on Venus.",
            "Neutron stars can spin at a rate of 600 rotations per second.",
            "There are more trees on Earth than stars in the Milky Way."
        ];
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(`🌌 **Space Fact:** ${fact}`);
    },
};

// 3. Animal Sound (animalsound.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('animalsound')
        .setDescription('Mimics a random animal sound.')
        .addStringOption(o => o.setName('animal').setDescription('Choose dog, cat, duck, or cow').setRequired(true)),
    async execute(interaction) {
        const animal = interaction.options.getString('animal').toLowerCase();
        let sound = '';
        if (animal === 'dog') sound = 'Woof! Woof!';
        else if (animal === 'cat') sound = 'Meow... Purrr.';
        else if (animal === 'duck') sound = 'Quack! Quack!';
        else if (animal === 'cow') sound = 'Moo~~~~!';
        else sound = 'Unknown animal sound! 🐾';

        await interaction.reply(`🔊 The **${animal}** goes: *${sound}*`);
    },
};

// 4. Fortune Cookie (fortune.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('fortune')
        .setDescription('Opens a virtual fortune cookie.'),
    async execute(interaction) {
        const fortunes = [
            "A thrilling time is in your near future.",
            "Your creative talents will lead you to great success.",
            "Good news will come to you by mail or message today.",
            "An exciting opportunity lies just ahead of you."
        ];
        const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        await interaction.reply(`🥠 **Cookie Fortune:** "${fortune}"`);
    },
};

// 5. Team Pick (teampick.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('teampick')
        .setDescription('Randomly picks a side between Option A and Option B.')
        .addStringOption(o => o.setName('option1').setDescription('First choice').setRequired(true))
        .addStringOption(o => o.setName('option2').setDescription('Second choice').setRequired(true)),
    async execute(interaction) {
        const opt1 = interaction.options.getString('option1');
        const opt2 = interaction.options.getString('option2');
        const chosen = Math.random() < 0.5 ? opt1 : opt2;
        await interaction.reply(`⚖️ Between **${opt1}** and **${opt2}**, I choose: **${chosen}**!`);
    },
};

// 6. Magic Spell (spell.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('spell')
        .setDescription('Casts a random wizard spell.'),
    async execute(interaction) {
        const spells = [
            "Expecto Patronum! ✨ (A bright guardian appears)",
            "Lumen Spark! ⚡ (The area lights up with electric sparks)",
            "Aqua Blast! 🌊 (A gush of water rushes forward)"
        ];
        const spell = spells[Math.floor(Math.random() * spells.length)];
        await interaction.reply(`🧙‍♂️ ${spell}`);
    },
};

// 7. Punchline (punchline.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('punchline')
        .setDescription('Delivers a classic setup and punchline.'),
    async execute(interaction) {
        await interaction.reply("🎭 **Setup:** Why did the scarecrow win an award?\n💥 **Punchline:** Because he was outstanding in his field!");
    },
};

// 8. Server Region Check (region.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('region')
        .setDescription('Displays information about the server platform setup.'),
    async execute(interaction) {
        await interaction.reply(`🌐 Server connection status: Optimized and routed successfully through primary gateway nodes.`);
    },
};

// 9. Quick Poll Alternative (quickpoll.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('quickpoll')
        .setDescription('Starts a fast yes/no vote.')
        .addStringOption(o => o.setName('topic').setDescription('Topic to vote on').setRequired(true)),
    async execute(interaction) {
        const topic = interaction.options.getString('topic');
        const msg = await interaction.reply({ content: `🗳️ **Quick Vote:** ${topic}`, fetchReply: true });
        await msg.react('✅');
        await msg.react('❌');
    },
};

// 10. Coin Streak (coinstreak.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinstreak')
        .setDescription('Simulates a double flip coin streak game.'),
    async execute(interaction) {
        const outcomes = ['Heads', 'Tails'];
        const first = outcomes[Math.floor(Math.random() * outcomes.length)];
        const second = outcomes[Math.floor(Math.random() * outcomes.length)];
        await interaction.reply(`🪙 Double Streak Result -> Flip 1: **${first}** | Flip 2: **${second}**`);
    }, 
};
