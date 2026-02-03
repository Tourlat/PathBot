const { SlashCommandBuilder } = require('discord.js');
const PathService = require('../../services/PathService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('save')
        .setDescription('Save a new route with an alias')
        .addStringOption(option =>
            option.setName('alias')
                .setDescription('Route alias (e.g., home-work)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('origin')
                .setDescription('Starting address')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('destination')
                .setDescription('Destination address')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const pathService = new PathService();
        const alias = interaction.options.getString('alias');
        const origin = interaction.options.getString('origin');
        const destination = interaction.options.getString('destination');

        try {
            const savedRoute = await pathService.saveRoute(interaction.user.id, alias, origin, destination);

            await interaction.editReply({
                content: `✅ Route "${alias}" saved successfully!\n**From:** ${savedRoute.origin}\n**To:** ${savedRoute.destination}`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.editReply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    },
};