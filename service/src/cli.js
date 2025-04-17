#!/usr/bin/env node
const { program } = require('commander');
const chalk = require('chalk');
const { getPlayerByGameId } = require('../server/playerService');

// 格式化输出选手信息
function formatPlayerInfo(player) {
    if (!player) {
        console.log(chalk.red('未找到选手信息'));
        return;
    }

    console.log(chalk.bold.cyan('\n选手基本信息:'));
    console.log(chalk.white('游戏ID: ') + chalk.yellow(player.gameid));
    console.log(chalk.white('真实姓名: ') + chalk.yellow(player.realname));
    console.log(chalk.white('国籍: ') + chalk.yellow(player.nationality));

    if (player.teamname) {
        console.log(chalk.bold.cyan('\n队伍信息:'));
        console.log(chalk.white('当前队伍: ') + chalk.yellow(player.teamname));
    }

    if (player.agents && player.agents.length > 0) {
        console.log(chalk.bold.cyan('\n常用特工:'));
        player.agents.forEach(agent => {
            console.log(chalk.white(`${agent.agentName}: `) + 
                chalk.yellow(`${agent.roundsPlayed} 回合`) +
                chalk.gray(` (使用率: ${agent.useRate})`));
        });
    }
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
        } catch (error) {
            console.error(chalk.red`查询失败: ` + error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);