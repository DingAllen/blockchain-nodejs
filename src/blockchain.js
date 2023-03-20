const crypto = require('crypto');

// 创世区块
const genesisBlock = {
    index: 0,
    data: 'dkx is here',
    prevHash: 0,
    timestamp: 1679305922275,
    nouce: 37,
    hash: '008569658585228fe7c4d5cdbac1b947668222bb13be3b9ef147432733e16b5b'
};

class Blockchain {

    constructor() {
        this.blockchain = [genesisBlock];
        this.data = [];
        this.difficulty = 2;
    }

    // 获取最新区块
    getLastBlock() {
        return this.blockchain[this.blockchain.length - 1];
    }

    // 挖矿
    mine() {
        let nouce = 0;
        const index = this.blockchain.length;
        const prevHash = this.getLastBlock().hash;
        const timestamp = Date.now();
        const data = this.data;

        let hash = this.computeHash(index, prevHash, timestamp, data, nouce);
        while(hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
            nouce++;
            hash = this.computeHash(index, prevHash, timestamp, data, nouce);
        }
        console.log('挖矿结束！信息如下：', {
            index,
            data,
            prevHash,
            timestamp,
            nouce,
            hash
        });
    }

    // 生成新区块
    generateNewBlock() {
    }

    // 计算哈希
    computeHash(index, prevHash, timestamp, data, nonce) {
        return crypto.createHash('sha256').update(index + prevHash + timestamp + data + nonce).digest('hex');
    }

    // 校验区块
    isValidBlock() {

    }

    // 校验区块链
    isValidChain() {

    }
}

let bc = new Blockchain();
bc.mine();
console.log(new Date().getTime());
console.log(Date.now());