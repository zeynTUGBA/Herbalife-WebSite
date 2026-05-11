const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// --- GÜNCEL PAYTR KİMLİK BİLGİLERİN ---
const config = {
    merchant_id: '681687',
    merchant_key: 'm85YjaAC3JgKQgms',
    merchant_salt: 'HtFAkgAzFTwXyP9Y'
};

app.post('/pay', (req, res) => {
    const { cart, customer } = req.body;

    // Toplam tutar hesabı (Kuruş cinsinden)
    let total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const payment_amount = Math.round(total * 100); 

    const merchant_oid = "SIP" + Date.now(); 
    const user_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    const merchant_ok_url = "http://localhost:3000/success"; // Başarılı ödeme sonrası yönlenecek sayfa
    const merchant_fail_url = "http://localhost:3000/fail";  // Hatalı ödeme sonrası yönlenecek sayfa
    const user_name = customer.name;
    const user_address = customer.address;
    const user_phone = customer.phone;
    const user_email = "sssabit@gmail.com"; 
    const currency = "TL";
    const test_mode = "1"; // Canlıya geçince "0" yapmalısın
    const no_installment = "0"; 
    const max_installment = "0";

    // Sepeti PayTR'ın istediği Base64 formatına çevirme
    const user_basket = JSON.stringify(cart.map(item => [
        item.name, 
        item.price.toString(), 
        item.quantity.toString()
    ]));
    const basket_base64 = Buffer.from(user_basket).toString('base64');

    // PayTR Token Oluşturma Şablonu
    const hash_str = config.merchant_id + user_ip + merchant_oid + user_email + payment_amount + basket_base64 + no_installment + max_installment + currency + test_mode + config.merchant_salt;
    const paytr_token = crypto.createHmac('sha256', config.merchant_key).update(hash_str).digest('base64');

    const params = {
        merchant_id: config.merchant_id,
        user_ip,
        merchant_oid,
        email: user_email,
        payment_amount,
        paytr_token,
        user_basket: basket_base64,
        nosim: no_installment,
        max_inst: max_installment,
        currency,
        test_mode,
        user_name,
        user_address,
        user_phone,
        merchant_ok_url,
        merchant_fail_url,
        debug_on: 1
    };

    res.json(params);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} üzerinde çalışıyor.`));