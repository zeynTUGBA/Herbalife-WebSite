DROP DATABASE IF EXISTS herbalife_shop;

CREATE DATABASE herbalife_shop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE herbalife_shop;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
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
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  merchant_oid VARCHAR(64) NULL UNIQUE,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('beklemede','odendi','kargoda','teslim','iptal')
    DEFAULT 'beklemede',
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(150),
  customer_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
);

CREATE TABLE carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest_token VARCHAR(80) NOT NULL UNIQUE,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_product (cart_id, product_id),
  FOREIGN KEY (cart_id) REFERENCES carts(id)
    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE slider_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_name VARCHAR(50) NOT NULL UNIQUE,
  image_url_1 VARCHAR(500),
  image_url_2 VARCHAR(500),
  image_url_3 VARCHAR(500),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO slider_images (page_name, image_url_1, image_url_2, image_url_3) VALUES
('index', 'https://picsum.photos/900/400?1', 'https://picsum.photos/900/400?2', 'https://picsum.photos/900/400?3'),
('urunler', 'https://picsum.photos/900/400?11', 'https://picsum.photos/900/400?12', 'https://picsum.photos/900/400?13'),
('kampanyalar', 'https://picsum.photos/900/400?1', 'https://picsum.photos/900/400?2', 'https://picsum.photos/900/400?3'),
('hakkimizda', 'https://picsum.photos/900/400?21', 'https://picsum.photos/900/400?22', 'https://picsum.photos/900/400?23'),
('iletisim', 'https://picsum.photos/900/400?31', 'https://picsum.photos/900/400?32', 'https://picsum.photos/900/400?33');

SHOW TABLES;
