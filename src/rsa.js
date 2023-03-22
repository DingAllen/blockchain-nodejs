var fs = require('fs');
const crypto = require("crypto");
const secp256k1 = require("secp256k1");

class Wallet {
    constructor(name) {
        this.keys = this.genKeyPair(name);
    }

    // 签名
    sign({from, to, amount}) {

        const messageHash = genDigest({from, to, amount});

        // 对消息哈希值进行签名
        const keyBuffer = Buffer.from(this.keys.privateKey, 'hex');
        const signature = secp256k1.ecdsaSign(messageHash, keyBuffer).signature
        return Buffer.from(signature).toString('hex');
    }

    getPublicKey() {
        return this.keys.publicKey;
    }

    genKeyPair(name) {
        var keys = readKeys(name);
        if (!keys) {
            keys = generateKeys(name);
        }
        return keys;
    }
}

// 校验签名
const verifySignature = ({from, to, amount, signature}, publicKey) => {

    // 将signature和publicKey从Buffer中还原回去
    signature = Buffer.from(signature, 'hex');
    publicKey = Buffer.from(publicKey, 'hex');

    const messageHash = genDigest({from, to, amount});
    return secp256k1.ecdsaVerify(signature, messageHash, publicKey);
}

const messageDigest = (message) => {
    return crypto.createHash('sha256').update(message).digest();
}

const genMessage = ({from, to, amount}) => {
    return `${from}-${to}-${amount}`;
}

const genDigest = ({from, to, amount}) => {
    return messageDigest(genMessage({from, to, amount}));
}

// 生成公私钥对,并保存进json文件
const generateKeys = (filename) => {

    // 判断文件后缀，若无后缀就添加后缀为json，若有后缀就判断是否为json，若不是json就报错
    let file = filename.split('.');
    if (file.length === 1) {
        file.push('json');
    }
    if (file[file.length - 1] !== 'json') {
        console.log('文件后缀名错误，无法生成公私钥');
        return;
    }
    // 恢复文件名
    file = file.join('.');

    // 生成私钥， 生成格式为uint8Array
    const privateKey = crypto.randomBytes(32);
    // 生成公钥
    const publicKey = secp256k1.publicKeyCreate(privateKey);

    // 将公私钥对存入json文件
    const keys = {
        publicKey: Buffer.from(publicKey).toString('hex'),
        privateKey: Buffer.from(privateKey).toString('hex')
    }
    const data = JSON.stringify(keys);
    fs.writeFile(file, data, (err) => {
        if (err) throw err;
        console.log('生成了新的公私钥对，已保存到' + file + '中');
    });
    return keys;
}

// 从json文件中读取公私钥对
const readKeys = (filename) => {

    // 判断文件后缀，若无后缀就添加后缀为json，若有后缀就判断是否为json，若不是json就报错
    let file = filename.split('.');
    if (file.length === 1) {
        file.push('json');
    }
    if (file[file.length - 1] !== 'json') {
        console.log('文件后缀名错误，无法读取公私钥');
        return;
    }
    // 恢复文件名
    file = file.join('.');

    // 读取json文件,若文件不存在则返回null
    let keys;
    try {
        keys = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
        return null;
    }

    // 检查公私钥对是否合法
    if (!checkKeys(keys)) {
        console.log('公私钥对不合法！');
        return null;
    }

    return keys;
}

// 检查公私钥对是否匹配
const checkKeys = (keys) => {
    return genPublicKey(keys.privateKey) === keys.publicKey;
}

// 根据私钥得到公钥
const genPublicKey = (privateKey) => {
    return Buffer.from(secp256k1.publicKeyCreate(Buffer.from(privateKey, 'hex'))).toString('hex');
}

// const trans = {from: '304502210083b687913ead74e1b41a7c2ca11fdee8f8d6877deff7cb5b2dce6198f699', to: 'b', amount: 10};
// const trans1 = {from: '304502210083b687913ead74e1b41a7c2ca11fdee8f8d6877deff7cb5b2dce6198f6996', to: 'b', amount: 10};
// const wallet = new Wallet('a');
// const signature = wallet.sign(trans);
// trans.signature = signature;
// trans1.signature = signature;
// console.log(signature)
// console.log('验证trans:', verifySignature(trans, wallet.getPublicKey()))
// console.log('验证trans1:', verifySignature(trans1, wallet.getPublicKey()))

module.exports = {Wallet, verifySignature};