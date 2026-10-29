// Web Push with only node:crypto: message encryption (RFC 8291, aes128gcm) and
// VAPID signing (RFC 8292). Kept separate from the handler so it can be tested locally.
import crypto from "node:crypto";

export const b64u = (buf) => Buffer.from(buf).toString("base64url");
export const fromB64u = (str) => Buffer.from(str, "base64url");

const hkdf = (salt, ikm, info, length) => Buffer.from(crypto.hkdfSync("sha256", ikm, salt, info, length));

/** Encrypts `payload` for one browser subscription. Returns the request body. */
export function encrypt(payload, p256dh, auth) {
  const uaPublic = fromB64u(p256dh); // browser's public key (65 bytes, uncompressed)
  const authSecret = fromB64u(auth);
  const ecdh = crypto.createECDH("prime256v1");
  const asPublic = ecdh.generateKeys(); // our one-time key pair
  const shared = ecdh.computeSecret(uaPublic);
  const salt = crypto.randomBytes(16);

  const ikm = hkdf(authSecret, shared, Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic]), 32);
  const cek = hkdf(salt, ikm, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdf(salt, ikm, Buffer.from("Content-Encoding: nonce\0"), 12);

  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  // A single record: the payload, then the 0x02 "last record" delimiter.
  const body = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);

  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  return Buffer.concat([salt, recordSize, Buffer.from([asPublic.length]), asPublic, body]);
}

/** The Authorization header that proves the push comes from this app's VAPID key. */
export function vapidHeader(endpoint, publicKey, privateKey, subject) {
  const pub = fromB64u(publicKey); // 0x04 || x || y
  const key = crypto.createPrivateKey({
    format: "jwk",
    key: { kty: "EC", crv: "P-256", d: privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) },
  });
  const header = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = b64u(
    JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject }),
  );
  const signature = crypto.sign("sha256", Buffer.from(`${header}.${claims}`), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${header}.${claims}.${b64u(signature)}, k=${publicKey}`;
}

/**
 * Sends one notification. Returns the HTTP status: 201 = accepted,
 * 404/410 = the subscription is gone (the browser unsubscribed or was reset).
 */
export async function sendPush(subscription, payload, { publicKey, privateKey, subject, topic, ttl = 86400 }) {
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      TTL: String(ttl),
      Urgency: "normal",
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      Authorization: vapidHeader(subscription.endpoint, publicKey, privateKey, subject),
      // Same topic = the newer message replaces an undelivered older one (one per list).
      ...(topic && { Topic: topic }),
    },
    body: encrypt(JSON.stringify(payload), subscription.p256dh, subscription.auth),
  });
  return response.status;
}

/** A new VAPID key pair: { publicKey, privateKey } as base64url. */
export function generateVapidKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const jwk = privateKey.export({ format: "jwk" });
  const pub = Buffer.concat([Buffer.from([4]), fromB64u(jwk.x), fromB64u(jwk.y)]);
  void publicKey;
  return { publicKey: b64u(pub), privateKey: jwk.d };
}
