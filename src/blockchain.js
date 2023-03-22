const crypto = require('crypto');
const dgram = require("dgram");
const {Wallet, verifySignature} = require('./rsa');

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

    constructor(wallet_name) {
        this.blockchain = [genesisBlock];
        this.data = [];
        this.remote = {};
        this.difficulty = 2;

        this.wallet = new Wallet(wallet_name);

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
            const data = JSON.parse(msg.toString());

            if (data.type) {
                this.dispatch(data, rinfo);
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

    boardcast(data) {
        this.peers.forEach(peer => {
            this.send(data, peer.port, peer.address);
        });
    }

    dispatch(data, rinfo) {
        switch (data.type) {
            case 'newPeer':
                this.send({type: 'remoteAddress', data: rinfo}, rinfo.port, rinfo.address);
                this.send({type: 'peerList', data: this.peers}, rinfo.port, rinfo.address);
                this.boardcast({type: 'sayhi', data: rinfo});
                this.addPeer(rinfo);
                console.log('[信息]：新节点加入：', rinfo);
                console.log('[信息]：当前节点列表：', this.peers);
                break;
            case 'remoteAddress':
                // 存储地址，退出的时候用
                this.remote = data.data;
                this.addPeer(rinfo);
                break;
            case 'peerList':
                // 获取当前的节点列表
                console.log('[信息]：获取到节点列表：', data.data)
                this.addPeers(data.data);
                console.log('[信息]：当前节点列表：', this.peers);
                break;
            case 'sayhi':
                this.addPeer(data.data);
                console.log('[信息]：新节点加入：', data.data);
                console.log('[信息]：当前节点列表：', this.peers);
                break;
            default:
                console.log('[信息]：收到未知消息类型：', data);
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
    trans(from, to, amount) {

        if (from !== '0') {
            // 交易非挖矿
            const balance = this.getBalance(from);
            if (balance < amount) {
                console.log('余额不足:', {from, balance, amount});
                return null;
            }
        }

        // 签名校验
        var signature = this.wallet.sign({from, to, amount});

        var transObj = {
            from,
            to,
            amount,
            signature
        };
        this.data.push(transObj);
        return transObj;
    }

    transfer(to, amount) {
        return this.trans(this.wallet.getPublicKey(), to, amount);
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

    // 确认是否是合法转账
    isValidTrans(trans) {
        return verifySignature(trans, this.wallet.getPublicKey());
    }

    // 挖矿
    mine() {

        // 校验所有交易的合法性，删除非法交易
        this.data = this.data.filter(trans => this.isValidTrans(trans));

        // 挖矿结束时的矿工奖励,写死奖励为100
        this.trans('0', this.wallet.getPublicKey(), 100);

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

    addPeer(rinfo) {
        if (!this.peers.find(peer => peer.address === rinfo.address && peer.port === rinfo.port)) {
            this.peers.push(rinfo);
        }
    }

    addPeers(peers) {
        peers.forEach(peer => {
            this.addPeer(peer);
        });
    }
}


// let bc = new Blockchain();
// bc.mine();
// bc.mine();
// bc.mine();
// bc.mine();
// console.log(bc.blockchain);

module.exports = Blockchain;