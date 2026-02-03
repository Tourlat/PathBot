const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PathService = require('../../services/PathService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('times')
        .setDescription('Show real-time travel times for your routes')
        .addStringOption(option =>
            option.setName('alias')
                .setDescription('Specific route alias (optional - shows all if not specified)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const pathService = new PathService();
        const alias = interaction.options.getString('alias');

        try {
            let routesToCheck;

            if (alias) {
                const singleRoute = await pathService.getRoute(interaction.user.id, alias);
                routesToCheck = { [alias]: singleRoute };
            } else {
                routesToCheck = await pathService.getUserRoutes(interaction.user.id);
            }

            if (Object.keys(routesToCheck).length === 0) {
                await interaction.editReply('📭 No routes found.');
                return;
            }

            const routeInfos = await pathService.mapsService.getMultipleRoutesInfo(routesToCheck);

            const embed = new EmbedBuilder()
                .setTitle('⏱️ Real-time Travel Times')
                .setColor('#00ff00')
                .setTimestamp();

            for (const [routeAlias, info] of Object.entries(routeInfos)) {
                if (info.error) {
                    embed.addFields({
                        name: `❌ ${routeAlias}`,
                        value: `Error: ${info.error}`,
                        inline: true
                    });
                } else {
                    const trafficEmoji = info.hasTrafficDelay ? '🔴' : '🟢';
                    const trafficText = info.hasTrafficDelay ?
                        `\n⚠️ +${info.trafficDelay} min delay` :
                        '\n✅ Clear traffic';

                    embed.addFields({
                        name: `${trafficEmoji} ${routeAlias}`,
                        value: `**Distance:** ${info.distance}\n**Duration:** ${info.durationInTraffic || info.duration}${trafficText}`,
                        inline: true
                    });
                }
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply(`❌ Error: ${error.message}`);
        }
    },
};