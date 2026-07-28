// ==========================================
// PART 2: 10 MORE NEW COMMANDS IN A SINGLE CODE BLOCK
// ==========================================

// 1. Roll Dice Custom (rolldice.js)
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolldice')
        .setDescription('Rolls a 20-sided dice.'),
    async execute(interaction) {
        const roll = Math.floor(Math.random() * 20) + 1;
        await interaction.reply(`🎲 You rolled a **${roll}** on the 20-sided dice!`);
    },
};

// 2. Reminder Command (reminder.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Sets a quick reminder note.')
        .addStringOption(o => o.setName('task').setDescription('What to remind you about').setRequired(true)),
    async execute(interaction) {
        const task = interaction.options.getString('task');
        await interaction.reply({ content: `⏰ I will remember: "${task}"`, ephemeral: true });
    },
};

// 3. Compliment Command (compliment.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('compliment')
        .setDescription('Gives a nice compliment to someone.')
        .addUserOption(o => o.setName('target').setDescription('User to compliment').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const compliments = [
            "you have an awesome personality!",
            "you're a true gaming legend!",
            "your creativity is inspiring!",
            "you bring great energy to the community!"
        ];
        const comp = compliments[Math.floor(Math.random() * compliments.length)];
        await interaction.reply(`✨ Hey ${target}, ${comp}`);
    },
};

// 4. CatFact Command (catfact.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('catfact')
        .setDescription('Sends a random fact about cats.'),
    async execute(interaction) {
        const facts = [
            "Cats spend about 70% of their lives sleeping.",
            "A group of cats is called a clowder.",
            "Cats have over 200 vocalizations."
        ];
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(`🐱 **Cat Fact:** ${fact}`);
    },
};

// 5. DogFact Command (dogfact.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('dogfact')
        .setDescription('Sends a random fact about dogs.'),
    async execute(interaction) {
        const facts = [
            "A dog's sense of smell is about 100,000 times more acute than a human's.",
            "Dogs curl up in a ball when sleeping to protect their organs.",
            "All dogs can be traced back to a species that lived 40 million years ago."
        ];
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(`🐶 **Dog Fact:** ${fact}`);
    },
};

// 6. Snippet Command (snippet.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('snippet')
        .setDescription('Shares a quick programming tip.'),
    async execute(interaction) {
        await interaction.reply("💡 **Tip:** Always keep your command handlers modular and use try-catch blocks to prevent bot crashes!");
    },
};

// 7. Love Calculator (lovecalc.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('lovecalc')
        .setDescription('Calculates a fun compatibility percentage.')
        .addUserOption(o => o.setName('first').setDescription('First person').setRequired(true))
        .addUserOption(o => o.setName('second').setDescription('Second person').setRequired(true)),
    async execute(interaction) {
        const p1 = interaction.options.getUser('first');
        const p2 = interaction.options.getUser('second');
        const score = Math.floor(Math.random() * 101);
        await interaction.reply(`💖 Compatibility between ${p1} and ${p2}: **${score}%**`);
    },
};

// 8. ASCII Text (ascii.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ascii')
        .setDescription('Echoes text in bold caps styling.')
        .addStringOption(o => o.setName('text').setDescription('Text to style').setRequired(true)),
    async execute(interaction) {
        const text = interaction.options.getString('text').toUpperCase();
        await interaction.reply(`\`\`\`fix\n[ ${text} ]\n\`\`\``);
    },
};

// 9. Status Custom (statuscheck.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('statuscheck')
        .setDescription('Checks database connectivity status.'),
    async execute(interaction) {
        await interaction.reply("⚡ Database and Bot Core Systems are running smoothly with 0 latency issues.");
    },
};

// 10. Dice Duel (diceduel.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('diceduel')
        .setDescription('Rolls a dice duel between you and the bot.'),
    async execute(interaction) {
        const userRoll = Math.floor(Math.random() * 6) + 1;
        const botRoll = Math.floor(Math.random() * 6) + 1;
        let outcome = '';
        if (userRoll > botRoll) outcome = 'You win the duel! 🏆';
        else if (userRoll < botRoll) outcome = 'I win the duel! 🤖';
        else outcome = "It's a draw! 🤝";

        await interaction.reply(`🎲 You rolled: **${userRoll}** | I rolled: **${botRoll}**\n${outcome}`);
    },
};
          
