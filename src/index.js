const vorpal = require('vorpal')();
const BlockChain = require('./blockchain');
const Table = require('cli-table');

const blockchain = new BlockChain('dkx');

const formatLog = (data) => {

    if (!data || data.length === 0) {
        this.log('[信息]：您所查看的数据为空');
        return;
    }
    if (!Array.isArray(data)) {
        data = [data];
        if (data.length === 0) {
            this.log('[信息]：您所查看的数据为空');
            return;
        }
    }
    const first = data[0];
    const headers = Object.keys(first);
    const table =  new Table({
        head: headers,
        colWidths: headers.map(() => 20),
        rowHeights: headers.map(() => 6)
    });
    const result = data.map(item => {
        return headers.map(key => JSON.stringify(item[key], null, 1));
    });
    table.push(...result);
    console.log(table.toString());
}
vorpal.command('hello', '向这个程序问好，你会得到友好的回应').action(function (args, callback) {
    this.log('你好，帅哥!');
    callback();
});

// 实现全局聊天的功能
vorpal.command('chat <message>', '实现全局聊天的功能').action(function (args, callback) {
    blockchain.chat(args.message);
    callback();
});

// 查看还未打包的交易
vorpal.command('pending', '查看还未打包的交易').action(function (args, callback) {
    formatLog(blockchain.data);
    callback();
});

// 查看本地钱包的地址
vorpal.command('address', '查看本地钱包的地址').action(function (args, callback) {
    this.log(blockchain.wallet.getPublicKey());
    callback();
});

// 查看账户余额
vorpal.command('balance <address>', '查看账户余额').action(function (args, callback) {
    const address = args.address ? args.address : blockchain.wallet.getPublicKey();
    const balance = blockchain.getBalance(address);
    this.log({address: args.address, balance});
    callback();
});

// 查看区块详情
vorpal.command('detail <index>', '查看区块详情').action(function (args, callback) {
    const block = blockchain.blockchain[args.index];
    if (block) {
        console.log(JSON.stringify(block, null, 1));
    } else {
        this.log('区块不存在');
    }
    callback();
});

// 实现交易转账的命令行
vorpal.command('transfer <to> <amount>', '交易转账').action(function (args, callback) {
    let trans = blockchain.transfer(args.to, args.amount);
    if (trans) {
        this.log('交易成功，交易信息为：');
        formatLog(trans);
    }
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
vorpal.command('blockchain', '查看区块链').action(function (args, callback) {
    formatLog(blockchain.blockchain);
    callback();
});

// 查看网络节点列表
vorpal.command('peers', '查看网络节点列表').action(function (args, callback) {
    formatLog(blockchain.peers);
    callback();
});

vorpal.exec('help');
vorpal.delimiter('ding-chain => ').show();
