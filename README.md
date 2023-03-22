# 简单的区块链去中心化交易系统

Commands:

    help [command...]       Provides help for a given command.
    exit                    Exits application.
    hello                   向这个程序问好，你会得到友好的回应
    chat <message>          实现全局聊天的功能
    pending                 查看还未打包的交易
    address                 查看本地钱包的地址
    balance <address>       查看账户余额
    detail <index>          查看区块详情
    transfer <to> <amount>  交易转账
    mine                    挖矿
    blockchain              查看区块链
    peers                   查看网络节点列表

### 快速开始
    npm install
    npm run dev

值得注意的是，Blockchain.js中Blockchain类里seed的数据需要根据实际需要更改，这是种子节点的配置，很重要。