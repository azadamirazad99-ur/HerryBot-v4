const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Asks the magic 8ball a question.')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your question')
                .setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const answers = ['Yes.', 'No.', 'Maybe.', 'Definitely!', 'Ask again later.'];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        await interaction.reply(`🎱 **Question:** ${question}\n🔮 **Answer:** ${answer}`);
    },
};

