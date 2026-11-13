-- PrintPoint Centre Database Schema
-- 3D Printer Reservation Management System

PRAGMA foreign_keys = ON;

-- 1. Designers Table
CREATE TABLE IF NOT EXISTS designers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

-- 2. Printers Table
CREATE TABLE IF NOT EXISTS printers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  material TEXT NOT NULL
);

-- 3. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  designer_id INTEGER NOT NULL,
  printer_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (designer_id) REFERENCES designers(id),
  FOREIGN KEY (printer_id) REFERENCES printers(id)
);

