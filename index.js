#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const symbols = require('log-symbols');
const download = require('download-git-repo');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const del = require('del');

const gitRepoUrl = 'github:zxhfighter/angular-template';

// 开始下载
const spinner = ora('正在下载模板');
const questions = [
    {
        name: 'desc',
        message: '请输入项目描述<中/英文>'
    },
    {
        name: 'test',
        type: 'confirm',
        message: '是否需要生成测试文件?'
    },
    {
        name: 'style',
        type: 'list',
        message: '请选择你使用的样式框架？',
        choices: ['None', new inquirer.Separator(), 'Less', new inquirer.Separator(), 'Stylus']
    }
];

program.version('1.0.0', '-v, --version')
    .command('init <project>')
    .action(project => {
        inquirer.prompt(questions).then(answers => {
            const { desc, test, style } = answers;
            spinner.start();

            if (fs.existsSync(project)) {
                console.log(chalk.red(`目录 ${project} 已经存在，请更换路径或删除后再创建。`));
                process.exit(1);
            }
            else {
                download(gitRepoUrl, project, err => {
                    if (err) {
                        // 下载失败调用
                        spinner.fail();
                        console.log(symbols.error, chalk.red(err));
                    }
                    else {
                        // 下载成功调用
                        spinner.succeed();
                        console.log(symbols.success, chalk.green('模板下载成功'));

                        // 如果不需要测试文件，删除所有 .spec 文件，以及相关配置文件，同时还要修改 angular.json
                        if (!test) {
                            let delSpinner = ora('正在删除测试相关文件');
                            delSpinner.start();
                            del([project + '/e2e/**']).then(paths => {
                                delSpinner.succeed();
                                console.log(symbols.success, chalk.green('删除测试文件成功'));
                            }, e => {
                                delSpinner.fail();
                                console.log(symbols.success, chalk.green('删除测试文件失败'));
                            });
                        }

                        if (desc) {
                            const packageFilePath = project + '/package.json';
                            let packageFile = JSON.parse(fs.readFileSync(project + '/package.json', 'utf-8').toString());
                            packageFile.name = project;
                            packageFile.description = desc;

                            fs.writeFileSync(packageFilePath, JSON.stringify(packageFile, null, 2), 'utf-8');
                        }

                        console.log('');
                        console.log(symbols.success, chalk.green('项目初始化完成，之后步骤如下：'));
                        console.log(symbols.info, chalk.green('1. 运行 npm install 安装依赖'));
                        console.log(symbols.info, chalk.green('2. 运行 ng serve -o 启动应用'));
                    }
                });
            }
        });
    });

program.parse(process.argv);
