const vorpal = require('vorpal')();
const BlockChain = require('./blockchain');
const Table = require('cli-table');

const blockchain = new BlockChain();

const formatLog = (data) => {
    if (!Array.isArray(data)) {
        data = [data];
    }
    const first = data[0];
    const headers = Object.keys(first);
    const table = new Table({
        head: headers
    });
    const result = data.map(item => {
        return headers.map(key => item[key]);
    });
    table.push(...result);
    console.log(table.toString());
}
vorpal.command('hello', '向这个程序问好，你会得到友好的回应').action(function (args, callback) {
    this.log('你好，帅哥!');
    callback();
});

// 实现挖矿的命令行
vorpal.command('mine', '挖矿').action(function (args, callback) {
    const newBlock = blockchain.mine();
    if (newBlock) {
        this.log('挖矿成功，新区块为：');
        formatLog(newBlock);
    }
    callback();
});

// 实现查看区块链的命令行
vorpal.command('chain', '查看区块链').action(function (args, callback) {
    formatLog(blockchain.blockchain);
    callback();
});

vorpal.exec('help');
vorpal.delimiter('ding-chain => ').show();
