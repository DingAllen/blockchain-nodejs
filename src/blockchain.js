const crypto = require('crypto');
const dgram = require("dgram");

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

        // 所有的网络节点信息，address，port
        this.peers = [];
        // 种子节点
        this.seed = {port: 8001, address: 'localhost'};
        this.isSeed = false;

        this.udp = dgram.createSocket('udp4');
        this.init();
    }

    init() {
        this.bindP2p();
        this.bindExit();
    }

    bindP2p() {

        this.udp.on('message', (msg, rinfo) => {
            const {address, port} = rinfo;
            const data = JSON.parse(msg.toString());

            if (data.type) {
                this.dispatch(data, address, port);
            }
        });

        this.udp.on('listening', () => {
            const address = this.udp.address();
            console.log(`udp listening ${address.address}:${address.port}`);
        });

        if (process.argv[2] === 'seed') {
            this.ActAsSeed();
            this.startNode(this.seed.port);
        } else {
            const port = process.argv[2] || 0;
            this.startNode(port);
        }
    }

    bindExit() {
        this.udp.on('exit', () => {
            console.log('[信息]：你不要走啊，我离不开你啊燕子');
        });
    }

    startNode(port) {
        this.udp.bind(port);

        // 如果不是种子节点，就向种子节点发送通知
        if (!this.isSeed) {
            this.send({type: 'newPeer'}, this.seed.port, this.seed.address);
        }
    }

    send(data, port, address) {
        const msg = JSON.stringify(data);
        this.udp.send(Buffer.from(msg), port, address);
    }

    dispatch(data, address, port) {
        switch (data.type) {
            case 'newPeer':
                // this.addPeer(address, port);
                console.log('新节点加入：', {address, port});
                break;
            default:
                console.log('未知消息类型：', data);
                break;
        }
    }

    // 作为种子节点使用
    ActAsSeed() {
        this.isSeed = true;
    }

    // 获取最新区块
    getLastBlock() {
        return this.blockchain[this.blockchain.length - 1];
    }

    // 实现交易转账，姑且不使用UTXO
    transfer(from, to, amount) {

        if (from !== '0') {
            // 交易非挖矿
            const balance = this.getBalance(from);
            if (balance < amount) {
                console.log('余额不足:', {from, balance, amount});
                return null;
            }
        }

        //TODO: 签名校验

        const transObj = {
            from,
            to,
            amount
        };
        this.data.push(transObj);
        return transObj;
    }

    // 查看余额
    getBalance(address) {
        let balance = 0;
        this.blockchain.forEach(block => {

            // 排除创世区块
            if (block.index === 0) {
                return;
            }

            block.data.forEach(trans => {
                if (address === trans.from) {
                    balance -= trans.amount;
                }
                if (address === trans.to) {
                    balance += trans.amount;
                }
            });
        });
        return balance;
    }

    // 挖矿
    mine(address) {

        // 挖矿结束时的矿工奖励,写死奖励为100
        this.transfer('0', address, 100);

        const newBlock = this.generateNewBlock();

        // 如果区块合法且区块链合法，就新增该区块
        if (this.isValidBlock(newBlock) && this.isValidChain()) {
            this.blockchain.push(newBlock);
            this.data = [];
            return newBlock;
        }
        return null;
    }

    // 生成新区块
    generateNewBlock() {
        let nouce = 0;
        const index = this.blockchain.length;
        const prevHash = this.getLastBlock().hash;
        const timestamp = Date.now();
        const data = this.data;

        let hash = this.computeHash(index, prevHash, timestamp, data, nouce);
        while (hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
            nouce++;
            hash = this.computeHash(index, prevHash, timestamp, data, nouce);
        }
        return {
            index,
            data,
            prevHash,
            timestamp,
            nouce,
            hash
        };
    }

    // 计算哈希
    computeHash(index, prevHash, timestamp, data, nonce) {
        return crypto.createHash('sha256').update(index + prevHash + timestamp + data + nonce).digest('hex');
    }

    // 校验区块
    isValidBlock(block) {
        const prevBlock = this.blockchain[block.index - 1];
        if (prevBlock.index + 1 !== block.index) {
            console.log('区块索引不合法:', block);
            return false;
        } else if (prevBlock.hash !== block.prevHash) {
            console.log('区块没有正确指向前一区块:', block);
            return false;
        } else if (block.timestamp <= prevBlock.timestamp) {
            console.log('区块时间戳不合法:', block);
            return false;
        } else if (this.computeHash(block.index, block.prevHash, block.timestamp, block.data, block.nouce) !== block.hash) {
            console.log('区块哈希不合法:', block);
            return false;
        } else if (block.hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
            console.log('区块难度不合法:', block);
            return false;
        }
        return true;
    }

    // 校验区块链
    isValidChain(chain = this.blockchain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(genesisBlock)) {
            console.log('创世区块不合法');
            return false;
        }
        for (let i = chain.length - 1; i >= 1; i--) {
            if (!this.isValidBlock(chain[i])) {
                return false;
            }
        }
        return true;
    }
}

// let bc = new Blockchain();
// bc.mine();
// bc.mine();
// bc.mine();
// bc.mine();
// console.log(bc.blockchain);

module.exports = Blockchain;