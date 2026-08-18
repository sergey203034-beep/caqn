-- ===================================================================
-- «Лакомый кусочек» — схема базы данных MySQL
-- Импортируйте этот файл целиком через phpMyAdmin на вашем хостинге:
-- phpMyAdmin -> выбрать базу -> вкладка "Импорт" -> выбрать этот файл -> Ок
-- ===================================================================

CREATE TABLE IF NOT EXISTS cakes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  weight DECIMAL(6,2),
  tiers INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  available TINYINT(1) DEFAULT 1,
  description TEXT,
  media JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) DEFAULT 'client',
  addresses JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  userId VARCHAR(64),
  items JSON,
  total DECIMAL(10,2),
  status VARCHAR(32) DEFAULT 'new',
  date VARCHAR(32),
  deliveryDate VARCHAR(32),
  name VARCHAR(255),
  phone VARCHAR(64),
  address VARCHAR(255),
  comment TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY,
  social JSON,
  contact JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS support_chats (
  id VARCHAR(64) PRIMARY KEY,
  visitorId VARCHAR(64),
  name VARCHAR(255),
  messages JSON,
  unreadForAdmin TINYINT(1) DEFAULT 0,
  unreadForUser TINYINT(1) DEFAULT 0,
  updatedAt BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- Важно про безопасность
-- Это упрощённый бэкенд для сайта-визитки/показа знакомым:
--   • пароли пользователей хранятся открытым текстом — не просите
--     никого использовать здесь пароли, которые применяются где-то ещё;
--   • доступ к API защищён общим "ключом" (API_KEY в db-config.php и
--     BACKEND_KEY в js/backend-config.js) — это удобно, но не такая
--     надёжная защита, как у настоящего личного кабинета с паролями
--     на сервере. Для реального бизнеса с платежами и личными данными
--     клиентов потребуется более серьёзная защита.
-- ===================================================================
