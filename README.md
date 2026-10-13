# TaskFlow 🚀

A real-time collaborative Task Management / Kanban board application built with a modern full-stack architecture. Designed for seamless task tracking with instant updates across clients using WebSockets.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** Next.js (App Router, TypeScript)
* **Styling:** Tailwind CSS
* **HTTP Client:** Axios
* **Real-Time Client:** Socket.io-client

### **Backend**
* **Runtime:** Node.js, Express.js
* **Database:** MongoDB & Mongoose
* **Real-Time Engine:** Socket.io

---

## ✨ Features

* **Real-Time Collaboration:** Instant task creation and status synchronization across all connected clients via WebSockets.
* **Kanban Workflow:** Interactive 3-column board (`Todo`, `In Progress`, `Done`) with smooth status transitions.
* **RESTful API:** Robust backend endpoints for task CRUD operations.
* **Responsive UI:** Clean and modern layout optimized for various screen sizes.

---

## 📁 Project Structure

```text
TaskFlow/
├── client/          # Next.js Frontend
│   ├── app/         # App Router pages & layout
│   ├── services/    # Axios API service calls
│   └── socket.ts    # Socket.io client configuration
└── Server/          # Express Backend
    ├── models/      # Mongoose Task schema
    └── server.js    # Express server & Socket.io handlers
