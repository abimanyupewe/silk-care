import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  DUITKU_ORD_PREFIX,
  DUITKU_SUB_PREFIX,
  isDuitkuConfigured,
  mapDuitkuCallbackStatus,
  verifyDuitkuCallbackSignature
} from '@/lib/payments/duitku';

// Env uji di proses ini: meniru callback sandbox tanpa kredensial asli.
process.env.DUITKU_MERCHANT_CODE = 'DXXXX';
process.env.DUITKU_API_KEY = 'KEYTEST0123456789';

assert.equal(isDuitkuConfigured(), true);

const sign = (stringToSign: string) =>
  createHmac('sha256', process.env.DUITKU_API_KEY!).update(stringToSign).digest('hex');

const callback = {
  merchantCode: 'DXXXX',
  amount: '600000',
  merchantOrderId: `${DUITKU_SUB_PREFIX}1f3bd477-9db6-4e67-9d44-8e22c919d1e8`,
  resultCode: '00',
  reference: 'DXXXXREF',
  signature: ''
};

// Signature sah: merchantCode + amount + merchantOrderId, urutan sesuai docs POP callback.
callback.signature = sign(`${callback.merchantCode}${callback.amount}${callback.merchantOrderId}`);
assert.equal(verifyDuitkuCallbackSignature(callback), true);

// Gagal bila merchantCode tidak sama dengan env (merchant lain mencoba).
assert.equal(verifyDuitkuCallbackSignature({ ...callback, merchantCode: 'DYANGSALAH' }), false);
// Gagal bila amount diubah (string yang di-hash berbeda).
assert.equal(verifyDuitkuCallbackSignature({ ...callback, amount: '999999' }), false);
// Gagal bila signature kosong/pendek.
assert.equal(verifyDuitkuCallbackSignature({ ...callback, signature: 'x' }), false);

// Env hilang → signature tidak bisa diverifikasi.
const merchantCode = process.env.DUITKU_MERCHANT_CODE;
delete process.env.DUITKU_MERCHANT_CODE;
assert.equal(isDuitkuConfigured(), false);
assert.equal(verifyDuitkuCallbackSignature(callback), false);
process.env.DUITKU_MERCHANT_CODE = merchantCode;
assert.equal(isDuitkuConfigured(), true);

// Pemetaan resultCode: 00 sukses, 02 gagal, kode lain jangan mengubah status.
assert.equal(mapDuitkuCallbackStatus('00'), 'PAID');
assert.equal(mapDuitkuCallbackStatus('02'), 'FAILED');
assert.equal(mapDuitkuCallbackStatus('01'), null);

// Beda awalan alur: SUB untuk langganan, ORD untuk pesanan (alur pesanan belum aktif).
assert.ok(callback.merchantOrderId.startsWith(DUITKU_SUB_PREFIX));
assert.ok(DUITKU_ORD_PREFIX.length > 0);

console.log('duitku.check: ok');
