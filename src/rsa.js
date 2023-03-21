var EC = require('elliptic').ec;
var fs = require('fs');

var ec = new EC('secp256k1');

class Wallet {
    #keyPair = null;
    #keys = null;
    constructor(name) {
        [this.#keyPair, this.#keys] = this.genKeyPair(name);
    }

    // 签名
    sign({from, to, amount}) {
        const bufferMsg = Buffer.from(`${from}-${to}-${amount}`);
        return Buffer.from(this.#keyPair.sign(bufferMsg).toDER()).toString('hex');
    }

    getPublicKey() {
        return this.#keys.publicKey;
    }

    genKeyPair(name) {
        var keys = readKeys(name);
        if (!keys) {
            keys = generateKeys(name);
        }
        return [ec.keyFromPrivate(keys.privateKey, 'hex'), keys];
    }
}

// 校验签名
const verifySignature = ({from, to, amount, signature}, publicKey) => {
    const bufferMsg = Buffer.from(`${from}-${to}-${amount}`);
    return ec.keyFromPublic(publicKey, 'hex').verify(bufferMsg, signature);
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

    // 生成公私钥对
    const keyPair = ec.genKeyPair();

    // 将公私钥对存入json文件
    const keys = {
        publicKey: keyPair.getPublic('hex'),
        privateKey: keyPair.getPrivate('hex')
    }
    const data = JSON.stringify(keys);
    fs.writeFile(file, data, (err) => {
        if (err) throw err;
        console.log('生成了新的公私钥对，已保存到' + file);
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
    return getPublicKey(keys.privateKey) === keys.publicKey;
}

// 根据私钥得到公钥
const getPublicKey = (privateKey) => {
    const keyPair = ec.keyFromPrivate(privateKey);
    return keyPair.getPublic('hex');
}

const trans = {from: 'a', to: 'b', amount: 10};
const trans1 = {from: 'a1', to: 'b', amount: 10};
const wallet = new Wallet('a');
const signature = wallet.sign(trans);
trans.signature = signature;
trans1.signature = signature;
console.log(signature)
console.log('验证trans:', verifySignature(trans, wallet.getPublicKey()))
console.log('验证trans1:', verifySignature(trans1, wallet.getPublicKey()))
