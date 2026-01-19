# Haraz Invoice & Inventory System

## Overview
**Haraz Invoice System** is a robust, web-based application designed for **Haraz Coffee House** to streamline daily operations. It manages invoicing, inventory tracking, customer relationships, and financial reporting in a single, easy-to-use interface.

This project is built as a **Progressive Web App (PWA)**, meaning it can be installed on devices and works offline, while syncing data to the cloud when online.

## 🚀 Key Features

### 1. 🧾 Invoicing & Billing
*   **Quick Invoice Generation:** Select products, add quantities, and generate professional invoices instantly.
*   **Invoice Printing:** Print invoices directly to a thermal printer or standard printer.
*   **Email Integration:** Generate invoice images and automatically open the client's email app (Gmail, Outlook, etc.) to send them.
*   **Historical Records:** View, reprint, or delete past generated invoices.

### 2. 📦 Inventory & Procurement
*   **Real-time Stock Tracking:** Automatically deducts stock when invoices are created.
*   **Procurement Management:** Track items purchased from suppliers.
*   **Low Stock Alerts:** Visual indicators for items running low.

### 3. 👥 Customer Management
*   **Client Database:** Store customer names, phones, and email addresses.
*   **Auto-Complete:** Quickly find customers while creating invoices.

### 4. 📊 Financial Reports & Analytics
*   **Sales Visualization:** Interactive trends and charts showing sales performance.
*   **Credit/Debit Tracking:** Monitor paid vs. pending amounts.
*   **Daily & Monthly Reports:** Detailed tables of financial activity.

### 5. ☁️ Cloud Sync & Security
*   **Auto-Sync:** Data is automatically saved to **JSONBin.io** to prevent data loss.
*   **Secure Access:** Requires a valid Bin ID and API Key to access data.
*   **Local Backup:** Ability to reset or restore data from local storage.

## 🛠️ Technology Stack
*   **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
*   **Styling:** Custom CSS (Dark/Light mode capable), FontAwesome Icons
*   **Charts:** Chart.js for analytics
*   **PDF/Image Generation:** html2canvas
*   **PWA:** Service Workers (`sw.js`) and Manifest (`manifest.json`) for offline capabilities and app-like experience.

## 📱 How to Install (PWA)
1.  **Open the link** in Chrome (Android/PC) or Safari (iOS).
2.  **Android/PC:** Click "Install Haraz Invoice" in the address bar or menu.
3.  **iOS:** Tap "Share" -> "Add to Home Screen".
4.  The app will appear as a native application on your device.

## 📧 Email Setup
To use the email feature:
1.  Go to the **System** tab.
2.  Enter your **Sender Email** (e.g., your generic business email).
3.  When sending an invoice, the app will generate an image and open your default mail app/webmail to attach it.

---
*Generated for Haraz Coffee House*
