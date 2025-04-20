#!/usr/bin/env node
const { program } = require('commander');
const chalk = require('chalk');
const { getPlayerByGameId } = require('../server/playerService');

// 格式化输出选手信息
function formatPlayerInfo(player) {
    if (!player) {
        console.log(chalk.red('Player not found'));
        return;
    }

    console.log(chalk.bold.cyan('\nInfo:'));
    console.log(chalk.white('ID: ') + chalk.yellow(player.gameid));
    console.log(chalk.white('Realname: ') + chalk.yellow(player.realname));
    console.log(chalk.white('Nation: ') + chalk.yellow(player.nationality));
    console.log(chalk.white('Team: ') + chalk.yellow(player.teamname));
    console.log(chalk.white('S-Tier: ') + chalk.yellow(player.stier));

    if (player.agents && player.agents.length > 0) {
        console.log(chalk.bold.cyan('Signature Agents:'));
        player.agents.map(agent => {
            console.log(chalk.white(`${agent.agent}: `) + 
                chalk.yellow(`${agent.roundsPlayed} rounds`));
        });
    }
    process.exit(0);
}

// 设置命令行选项
program
    .version('1.0.0')
    .description('Valorant 选手信息查询工具')
    .argument('[gameid]', '选手的游戏ID')
    .action(async (gameid) => {
        if (!gameid) {
            console.log(chalk.yellow('请输入要查询的选手游戏ID'));
            process.exit(1);
        }

        try {
            console.log(chalk.cyan('正在查询选手信息...'));
            const playerData = await getPlayerByGameId(gameid);
            formatPlayerInfo(playerData);
            process.exit(0);
        } catch (error) {
            console.error(chalk.red`查询失败: ` + error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);