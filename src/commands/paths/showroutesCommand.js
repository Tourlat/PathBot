const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PathService = require('../../services/PathService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showroutes')
        .setDescription('Display all your saved routes'),

    async execute(interaction) {
        await interaction.deferReply();

        const pathService = new PathService();

        try {
            const userRoutes = await pathService.getUserRoutes(interaction.user.id);

            if (Object.keys(userRoutes).length === 0) {
                await interaction.editReply({
                    content: '📭 You have no saved routes.\nUse `/save` to create one.',
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🗺️ Your Saved Routes')
                .setColor('#0099ff')
                .setFooter({ text: `${Object.keys(userRoutes).length}/10 routes used` });

            for (const [alias, routeData] of Object.entries(userRoutes)) {
                embed.addFields({
                    name: `📍 ${alias}`,
                    value: `**From:** ${routeData.origin}\n**To:** ${routeData.destination}\n**Created:** ${new Date(routeData.createdAt).toLocaleDateString()}`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply({
                content: `❌ Error: ${error.message}`,
            });
        }
    },
};