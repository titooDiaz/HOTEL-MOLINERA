const { promisify } = require('util');
const { randomBytes, scrypt: scryptCallback, timingSafeEqual, createHash } = require('crypto');

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = await scrypt(password, salt, 64);
    return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
    const [salt, hashHex] = String(storedHash || '').split(':');
    if (!salt || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scrypt(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function createToken() {
    return randomBytes(32).toString('hex');
}

module.exports = { hashPassword, verifyPassword, hashToken, createToken };
