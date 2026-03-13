# 🖥️ NEU Laboratory Usage Log

A web-based system that records and monitors **laboratory room usage by professors** at **New Era University (NEU)**.  
Professors log sessions using their **@neu.edu.ph Google account**, while administrators monitor usage and generate reports.

---
### 🔗 Application Link
- https://studio-20404588-b672e.web.app/
- https://studio-20404588-b672e.firebaseapp.com/

---

# 📌 Overview

The system allows professors to log laboratory usage by entering:

- Room Number  
- College  
- Program  
- Section  
- Start Time  

When the session ends, the system records the **End Time** and calculates the **usage duration**.  
All records are stored in **Firebase Firestore**.

---

# 👥 User Roles

## 👨‍🏫 Professor
- Login using **Google Authentication (@neu.edu.ph only)**
- Log laboratory room usage
- End session to record **End Time and Duration**
- Receive confirmation message after submission
- Optional **QR code demo input**

## 👩‍💼 Admin
- View all room usage logs
- Search and filter records
- View **usage statistics dashboard**
- Manage laboratory rooms (add, edit, delete)
- Block or unblock professor accounts
- Export reports (**CSV / Excel**)

---

# 📊 Dashboard Features

Admins can view:

- Total Room Usage
- Total Hours Used
- Most Used Room
- Most Active Professor
- Current Active Sessions

---

# 👩‍💻 Tech Stack

- **Frontend:** HTML, CSS, JavaScript / React  
- **Authentication:** Firebase Authentication (Google Login)  
- **Database:** Firebase Firestore  
- **Hosting:** Firebase Hosting  

---

# 📂 Stored Data

Each log contains:

- Professor Email  
- Room Number  
- College  
- Program  
- Section  
- Start Time  
- End Time  
- Duration  
- Timestamp  

---

# 🎯 System Output

After submitting a session log, the system displays: Thank you for using Room [Room Number]
