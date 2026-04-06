# 📱 Social Media Backend

A scalable and secure backend for a social media application built with modern web technologies. This project handles user authentication, posts, interactions, and more.

---

## 🚀 Features

* 🔐 User Authentication (Login/Register with CLERK)
* 👤 User Profile Management
* 📝 Create, Update, Delete Posts
* ❤️ Like & Comment System
* 🧑‍🤝‍🧑 Follow / Unfollow Users
* 🔍 Search Users & Posts
* 📂 File Upload (Images)
* 🛡️ Protected Routes with Middleware
* ⚡ RESTful API Architecture

---

## 🛠️ Tech Stack

* **Backend Framework:** nodejs 
* **Language:** JavaScript
* **Database:** (MongoDB)
* **Authentication:** CLERK
* **Storage:** (Cloudinary)

---

## 📁 Project Structure

```
social_media_backend/
│── app/
│   ├── api/
│   ├── middleware.ts
│── lib/
│── models/
│── utils/
│── config/
│── public/
│── package.json
│── README.md
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Prashant-Kumar001/Social_media_backend.git
cd Social_media_backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the root:

```
DATABASE_URL=your_database_url
CLOUDINARY_URL=your_cloudinary_url
```

---

## ▶️ Running the Server

```bash
npm run dev
```

Server will run at:

```
http://localhost:3000
```

---

## 🔐 Authentication Flow

* Middleware checks token
* Protected routes require valid token
* Unauthorized users redirected to `/` with Login page

---

## 📡 API Endpoints (Example)

### Auth

* `POST /api/v1/user/register` → Register user
* `POST /api/v1/user/login` → Login user

### Users

* `GET /api/v1/users/:id` → Get user profile

### Posts

* `POST /api/v1/post/create` → Create post
* `GET /api/v1/post/feed` → Get all posts

---

## 🧠 Middleware Logic

* Redirects unauthenticated users to `/login`
* Prevents logged-in users from accessing `/login` or `/register`
* Protects routes like:

---

## 🧪 Future Improvements

* 🔔 full feature Notifications system 
* 📊 Analytics dashboard
* 🧠 AI-based recommendations

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch
3. Commit your changes
4. Push and create a PR

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Prashant**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
