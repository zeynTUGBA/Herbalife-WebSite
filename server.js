const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const axios = require("axios");
const mysql = require("mysql2/promise");
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "2009",
    database: process.env.DB_NAME || "herbalife_shop",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const paytrConfig = {
    merchant_id: process.env.PAYTR_MERCHANT_ID || "681687",
    merchant_key: process.env.PAYTR_MERCHANT_KEY || "m85YjaAC3JgKQgms",
    merchant_salt: process.env.PAYTR_MERCHANT_SALT || "HtFAkgAzFTwXyP9Y",
    test_mode: process.env.PAYTR_TEST_MODE || "1"
};

let pool;

async function initDatabase() {
    const bootstrap = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        multipleStatements: true
    });

    await bootstrap.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`
         CHARACTER SET utf8mb4
         COLLATE utf8mb4_unicode_ci`
    );
    await bootstrap.end();

    pool = mysql.createPool(dbConfig);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            stock INT DEFAULT 0,
            image_url VARCHAR(500),
            category VARCHAR(80) DEFAULT 'Genel',
            target ENUM('urunler','kampanyalar','hepsi') DEFAULT 'hepsi',
            barcode VARCHAR(80),
            colors_json JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            merchant_oid VARCHAR(64) NULL UNIQUE,
            total_price DECIMAL(10,2) NOT NULL,
            status ENUM('beklemede','odendi','kargoda','teslim','iptal') DEFAULT 'beklemede',
            customer_name VARCHAR(100),
            customer_phone VARCHAR(20),
            customer_email VARCHAR(150),
            customer_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS carts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guest_token VARCHAR(80) NOT NULL UNIQUE,
            user_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS cart_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cart_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_cart_product (cart_id, product_id),
            FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS slider_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            page_name VARCHAR(50) NOT NULL UNIQUE,
            image_url_1 VARCHAR(500),
            image_url_2 VARCHAR(500),
            image_url_3 VARCHAR(500),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150),
            email VARCHAR(255),
            phone VARCHAR(60),
            product_name VARCHAR(255),
            message TEXT NOT NULL,
            reply TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            replied_at TIMESTAMP NULL DEFAULT NULL
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS seller_credentials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            salt VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    const [sellerCount] = await pool.query("SELECT COUNT(*) AS count FROM seller_credentials");
    if (sellerCount[0].count === 0) {
        const defaultSalt = crypto.randomBytes(16).toString('hex');
        const defaultHash = hashPassword('sssabit1616', defaultSalt);
        await pool.query(
            `INSERT INTO seller_credentials (email, password_hash, salt) VALUES (?, ?, ?)`,
            ['sssabit@gmail.com', defaultHash, defaultSalt]
        );
    }

    // Initialize slider images if not exists
    const [sliderCheck] = await pool.query("SELECT COUNT(*) as count FROM slider_images");
    if (sliderCheck[0].count === 0) {
        await pool.query(`
            INSERT INTO slider_images (page_name, image_url_1, image_url_2, image_url_3) VALUES
            ('index', 'https://picsum.photos/900/400?1', 'https://picsum.photos/900/400?2', 'https://picsum.photos/900/400?3'),
            ('urunler', 'https://picsum.photos/900/400?11', 'https://picsum.photos/900/400?12', 'https://picsum.photos/900/400?13'),
            ('kampanyalar', 'https://picsum.photos/900/400?1', 'https://picsum.photos/900/400?2', 'https://picsum.photos/900/400?3'),
            ('hakkimizda', 'https://picsum.photos/900/400?21', 'https://picsum.photos/900/400?22', 'https://picsum.photos/900/400?23'),
            ('iletisim', 'https://picsum.photos/900/400?31', 'https://picsum.photos/900/400?32', 'https://picsum.photos/900/400?33')
        `);
    }

    await ensureColumn("orders", "merchant_oid", "merchant_oid VARCHAR(64) NULL UNIQUE");
    await ensureColumn("orders", "customer_name", "customer_name VARCHAR(100)");
    await ensureColumn("orders", "customer_phone", "customer_phone VARCHAR(20)");
    await ensureColumn("orders", "customer_email", "customer_email VARCHAR(150)");
    await ensureColumn("orders", "customer_address", "customer_address TEXT");
    await ensureColumn("products", "description", "description TEXT");
    await ensureColumn("products", "stock", "stock INT DEFAULT 0");
    await ensureColumn("products", "image_url", "image_url VARCHAR(500)");
    await ensureColumn("products", "category", "category VARCHAR(80) DEFAULT 'Genel'");
    await ensureColumn("products", "target", "target ENUM('urunler','kampanyalar','hepsi') DEFAULT 'hepsi'");
    await ensureColumn("products", "barcode", "barcode VARCHAR(80)");
    await ensureColumn("products", "colors_json", "colors_json JSON");
    await ensureColumn("messages", "product_barcode", "product_barcode VARCHAR(80)");
}

async function ensureColumn(table, column, definition) {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [dbConfig.database, table, column]
    );

    if (rows[0].count === 0) {
        await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
    }
}

function hashPassword(password, salt) {
    return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function verifyPassword(password, salt, hash) {
    return hashPassword(password, salt) === hash;
}

function cleanText(value, fallback = "") {
    return String(value || fallback).trim();
}

function makeGuestEmail(customer) {
    const phone = cleanText(customer.phone).replace(/\D/g, "");
    return phone ? `guest_${phone}@local.test` : `guest_${Date.now()}@local.test`;
}

async function upsertCheckoutUser(conn, customer) {
    const email = cleanText(customer.email, makeGuestEmail(customer)).toLowerCase();
    const name = cleanText(customer.name, "Misafir Musteri");
    const phone = cleanText(customer.phone);

    await conn.query(
        `INSERT INTO users (name, email, password, phone)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone)`,
        [name, email, "checkout_user", phone]
    );

    const [rows] = await conn.query("SELECT id, email FROM users WHERE email = ? LIMIT 1", [email]);
    return rows[0];
}

async function findOrCreateProduct(conn, item) {
    const barcode = cleanText(item.barcode);
    const name = cleanText(item.name, "Urun");
    const price = Number(item.price) || 0;

    if (barcode) {
        const [byBarcode] = await conn.query("SELECT id FROM products WHERE barcode = ? LIMIT 1", [barcode]);
        if (byBarcode.length) return byBarcode[0].id;
    }

    const [byName] = await conn.query(
        "SELECT id FROM products WHERE name = ? AND price = ? LIMIT 1",
        [name, price]
    );
    if (byName.length) return byName[0].id;

    const [result] = await conn.query(
        `INSERT INTO products
         (name, description, price, stock, image_url, category, target, barcode, colors_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            cleanText(item.desc),
            price,
            Number(item.stock) || 0,
            cleanText(item.img),
            cleanText(item.cat, "Genel"),
            ["urunler", "kampanyalar", "hepsi"].includes(item.target) ? item.target : "hepsi",
            barcode || null,
            JSON.stringify(item.colors || [])
        ]
    );

    return result.insertId;
}

async function createPendingOrder(cart, customer, merchantOid, total) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const user = await upsertCheckoutUser(conn, customer);
        const [orderResult] = await conn.query(
            `INSERT INTO orders
             (user_id, merchant_oid, total_price, status, customer_name, customer_phone, customer_email, customer_address)
             VALUES (?, ?, ?, 'beklemede', ?, ?, ?, ?)`,
            [
                user.id,
                merchantOid,
                total,
                cleanText(customer.name),
                cleanText(customer.phone),
                user.email,
                cleanText(customer.address)
            ]
        );

        for (const item of cart) {
            const productId = await findOrCreateProduct(conn, item);
            await conn.query(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                 VALUES (?, ?, ?, ?)`,
                [orderResult.insertId, productId, Number(item.quantity) || 1, Number(item.price) || 0]
            );
        }

        await conn.commit();
        return orderResult.insertId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

function verifyPaytrCallback(body) {
    const hashStr =
        body.merchant_oid +
        paytrConfig.merchant_salt +
        body.status +
        body.total_amount;

    const token = crypto
        .createHmac("sha256", paytrConfig.merchant_key)
        .update(hashStr)
        .digest("base64");

    return token === body.hash;
}

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ ok: true, database: dbConfig.database });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.get("/api/customers", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                u.id AS user_id,
                u.name AS user_name,
                u.email AS user_email,
                u.phone AS user_phone,
                o.id AS order_id,
                o.merchant_oid,
                o.total_price,
                o.status,
                o.customer_name,
                o.customer_phone,
                o.customer_email,
                o.customer_address,
                o.created_at AS order_date,
                p.name AS product_name,
                p.image_url,
                oi.quantity,
                oi.unit_price
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON p.id = oi.product_id
            ORDER BY COALESCE(o.created_at, u.created_at) DESC, o.id DESC
        `);

        const customerMap = new Map();

        for (const row of rows) {
            const key = row.user_id;
            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    id: row.user_id,
                    name: row.customer_name || row.user_name || "Misafir Musteri",
                    phone: row.customer_phone || row.user_phone || "",
                    email: row.customer_email || row.user_email || "",
                    city: "",
                    note: row.customer_address ? "Adres: " + row.customer_address : "",
                    source: "mysql",
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrderDate: row.order_date,
                    orders: [],
                    orderImages: []
                });
            }

            const customer = customerMap.get(key);
            if (!row.order_id) continue;

            let order = customer.orders.find((item) => item.id === row.order_id);
            if (!order) {
                order = {
                    id: row.order_id,
                    merchant_oid: row.merchant_oid,
                    total_price: Number(row.total_price) || 0,
                    status: row.status,
                    created_at: row.order_date,
                    items: []
                };
                customer.orders.push(order);
                customer.orderCount += 1;
                customer.totalSpent += Number(row.total_price) || 0;
                customer.lastOrderDate = customer.lastOrderDate || row.order_date;
            }

            if (row.product_name) {
                const item = {
                    name: row.product_name,
                    img: row.image_url || "",
                    quantity: Number(row.quantity) || 1,
                    price: Number(row.unit_price) || 0
                };
                order.items.push(item);
                if (customer.orderImages.length < 6) {
                    customer.orderImages.push(item);
                }
            }
        }

        res.json({ success: true, customers: Array.from(customerMap.values()) });
    } catch (err) {
        console.log("CUSTOMERS ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Seller login endpoint
app.post('/api/seller/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email ve şifre gerekli.' });
        }

        const [rows] = await pool.query('SELECT * FROM seller_credentials WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
        if (!rows.length || !verifyPassword(password, rows[0].salt, rows[0].password_hash)) {
            return res.status(401).json({ success: false, error: 'Giriş bilgileri hatalı.' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('SELLER LOGIN ERROR:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/seller/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Mevcut ve yeni şifre gerekli.' });
        }

        const [rows] = await pool.query('SELECT * FROM seller_credentials LIMIT 1');
        if (!rows.length) {
            return res.status(404).json({ success: false, error: 'Satıcı hesabı bulunamadı.' });
        }

        const seller = rows[0];
        if (!verifyPassword(currentPassword, seller.salt, seller.password_hash)) {
            return res.status(401).json({ success: false, error: 'Mevcut şifre yanlış.' });
        }

        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = hashPassword(newPassword, newSalt);
        await pool.query('UPDATE seller_credentials SET password_hash = ?, salt = ?, updated_at = NOW() WHERE id = ?', [newHash, newSalt, seller.id]);

        return res.json({ success: true });
    } catch (err) {
        console.error('SELLER PASSWORD ERROR:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Contact form endpoint - sends email to site owner
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message, product, product_barcode } = req.body || {};
    if (!message || !message.toString().trim()) return res.status(400).json({ success: false, error: 'Mesaj gerekli.' });

    const to = process.env.CONTACT_TO || 'sezzginakdemir@gmail.com';

    try {
        // store message in DB (support product barcode)
        if (pool) {
            let productName = product || null;
            if (!productName && product_barcode) {
                const [prows] = await pool.query('SELECT name FROM products WHERE barcode = ? LIMIT 1', [String(product_barcode).trim()]);
                if (prows && prows.length) productName = prows[0].name || productName;
            }
            await pool.query(
                `INSERT INTO messages (name, email, phone, product_name, product_barcode, message) VALUES (?, ?, ?, ?, ?, ?)`,
                [name || '', email || '', phone || '', productName || null, product_barcode || null, message]
            );
        }

        let transporter;
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: (process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true') || false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // fallback to Ethereal test account (dev) when no SMTP configured
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: { user: testAccount.user, pass: testAccount.pass }
            });
        }

        // Use a stable from address (SMTP may reject arbitrary From headers).
        const smtpFromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || `no-reply@local`;
        const displayFrom = process.env.MAIL_FROM_DISPLAY ? `${process.env.MAIL_FROM_DISPLAY} <${smtpFromAddress}>` : smtpFromAddress;
        const subject = `Yeni iletişim mesajı - ${name || 'Anonim'}`;
        const text = `İsim: ${name || ''}\nE-posta: ${email || ''}\nTelefon: ${phone || ''}\n\nMesaj:\n${message}`;
        const html = `<p><strong>İsim:</strong> ${name || ''}</p><p><strong>E-posta:</strong> ${email || ''}</p><p><strong>Telefon:</strong> ${phone || ''}</p><hr><p>${(message || '').replace(/\n/g,'<br>')}</p>`;

        const mailOptions = { from: displayFrom, to, subject, text, html };
        if (email) mailOptions.replyTo = email;

        const info = await transporter.sendMail(mailOptions);

        const preview = nodemailer.getTestMessageUrl(info) || null;
        res.json({ success: true, preview });
    } catch (err) {
        console.error('CONTACT SEND ERROR:', err);
        res.status(500).json({ success: false, error: err.message || 'Mail gönderilemedi' });
    }
});

app.delete("/api/customers/:id", async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, error: "Gecersiz musteri id." });
        }

        const [result] = await pool.query("DELETE FROM users WHERE id = ?", [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Musteri bulunamadi." });
        }

        res.json({ success: true });
    } catch (err) {
        console.log("CUSTOMER DELETE ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/api/slider/:page", async (req, res) => {
    try {
        const page = String(req.params.page).toLowerCase().trim();
        const [rows] = await pool.query("SELECT * FROM slider_images WHERE page_name = ?", [page]);
        
        if (!rows.length) {
            return res.status(404).json({ success: false, error: "Sayfa slider resitleri bulunamadi." });
        }

        const slider = rows[0];
        res.json({
            success: true,
            slider: {
                page: slider.page_name,
                images: [slider.image_url_1, slider.image_url_2, slider.image_url_3].filter(Boolean),
                image_url_1: slider.image_url_1 || "",
                image_url_2: slider.image_url_2 || "",
                image_url_3: slider.image_url_3 || ""
            }
        });
    } catch (err) {
        console.log("SLIDER GET ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put("/api/slider/:page", async (req, res) => {
    try {
        const page = String(req.params.page).toLowerCase().trim();
        const { image_url_1, image_url_2, image_url_3 } = req.body;

        const [rows] = await pool.query("SELECT id FROM slider_images WHERE page_name = ?", [page]);
        if (!rows.length) {
            return res.status(404).json({ success: false, error: "Sayfa bulunamadi." });
        }

        await pool.query(
            "UPDATE slider_images SET image_url_1 = ?, image_url_2 = ?, image_url_3 = ? WHERE page_name = ?",
            [image_url_1 || "", image_url_2 || "", image_url_3 || "", page]
        );

        res.json({ success: true, message: page + " slider resitleri guncellendi." });
    } catch (err) {
        console.log("SLIDER UPDATE ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/api/sliders", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM slider_images");
        const sliders = rows.map(slider => ({
            page: slider.page_name,
            images: [slider.image_url_1, slider.image_url_2, slider.image_url_3].filter(Boolean),
            image_url_1: slider.image_url_1 || "",
            image_url_2: slider.image_url_2 || "",
            image_url_3: slider.image_url_3 || ""
        }));

        res.json({ success: true, sliders });
    } catch (err) {
        console.log("SLIDERS ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Messages APIs
app.get('/api/messages', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
        res.json({ success: true, messages: rows });
    } catch (err) {
        console.error('MESSAGES GET ERROR:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/messages/:id/reply', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const reply = String(req.body.reply || '').trim();
        if (!id || !reply) return res.status(400).json({ success: false, error: 'Geçersiz istek.' });
        const [result] = await pool.query('UPDATE messages SET reply = ?, replied_at = NOW() WHERE id = ?', [reply, id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Mesaj bulunamadı.' });
        res.json({ success: true });
    } catch (err) {
        console.error('MESSAGE REPLY ERROR:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete a message
app.delete('/api/messages/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ success: false, error: 'Geçersiz mesaj id.' });

        const [result] = await pool.query('DELETE FROM messages WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Mesaj bulunamadı.' });

        res.json({ success: true });
    } catch (err) {
        console.error('MESSAGE DELETE ERROR:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


app.post("/pay", async (req, res) => {
    try {
        const { cart = [], customer = {} } = req.body;

        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ success: false, reason: "Sepet bos." });
        }

        const total = cart.reduce((sum, item) => {
            return sum + (Number(item.price) * (Number(item.quantity) || 1));
        }, 0);

        if (total <= 0) {
            return res.status(400).json({ success: false, reason: "Sepet tutari gecersiz." });
        }

        const payment_amount = Math.round(total * 100);
        const merchant_oid = "SIP" + Date.now();

        await createPendingOrder(cart, customer, merchant_oid, total);

        const user_ip =
            (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
            req.socket.remoteAddress ||
            "127.0.0.1";

        const email = cleanText(customer.email, makeGuestEmail(customer));
        const user_basket = Buffer.from(
            JSON.stringify(
                cart.map((item) => [
                    cleanText(item.name, "Urun"),
                    String(Number(item.price) || 0),
                    String(Number(item.quantity) || 1)
                ])
            )
        ).toString("base64");

        const no_installment = "0";
        const max_installment = "0";
        const currency = "TL";

        const hashSTR =
            paytrConfig.merchant_id +
            user_ip +
            merchant_oid +
            email +
            payment_amount +
            user_basket +
            no_installment +
            max_installment +
            currency +
            paytrConfig.test_mode +
            paytrConfig.merchant_salt;

        const paytr_token = crypto
            .createHmac("sha256", paytrConfig.merchant_key)
            .update(hashSTR)
            .digest("base64");

        const params = new URLSearchParams({
            merchant_id: paytrConfig.merchant_id,
            user_ip,
            merchant_oid,
            email,
            payment_amount: String(payment_amount),
            paytr_token,
            user_basket,
            no_installment,
            max_installment,
            currency,
            test_mode: paytrConfig.test_mode,
            user_name: cleanText(customer.name, "Misafir Musteri"),
            user_address: cleanText(customer.address, "Adres girilmedi"),
            user_phone: cleanText(customer.phone, "0000000000"),
            merchant_ok_url: process.env.PAYTR_OK_URL || "http://localhost:3000/success.html",
            merchant_fail_url: process.env.PAYTR_FAIL_URL || "http://localhost:3000/fail.html",
            timeout_limit: "30",
            debug_on: "1"
        });

        const response = await axios.post(
            "https://www.paytr.com/odeme/api/get-token",
            params.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        console.log("PAYTR:", response.data);

        if (response.data.status === "success") {
            return res.json({
                success: true,
                merchant_oid,
                iframe_link: "https://www.paytr.com/odeme/guvenli/" + response.data.token
            });
        }

        return res.json({ success: false, reason: response.data.reason });
    } catch (err) {
        console.log("ERROR:", err.response?.data || err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/payment-callback", async (req, res) => {
    try {
        if (!verifyPaytrCallback(req.body)) {
            console.log("PAYTR callback hash hatasi:", req.body);
            return res.status(400).send("PAYTR notification failed: bad hash");
        }

        const status = req.body.status === "success" ? "odendi" : "iptal";
        await pool.query("UPDATE orders SET status = ? WHERE merchant_oid = ?", [
            status,
            req.body.merchant_oid
        ]);

        console.log("PAYTR CALLBACK:", req.body);
        return res.send("OK");
    } catch (err) {
        console.log("CALLBACK ERROR:", err.message);
        return res.status(500).send("ERROR");
    }
});

initDatabase()
    .then(() => {
        app.listen(3000, () => {
            console.log("Server running: http://localhost:3000");
            console.log("Database ready:", dbConfig.database);
        });
    })
    .catch((err) => {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    });
