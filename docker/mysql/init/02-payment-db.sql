CREATE DATABASE IF NOT EXISTS phongan_payment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON phongan_payment.* TO 'dbuser'@'%';
FLUSH PRIVILEGES;
