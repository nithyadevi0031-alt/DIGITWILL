

# 1. Project Title

## **Digital Will AI – secure digital asset inheritance platform**

### Team Details

* Team Name:master of none
* Team Leader:Nithyalakshmi .s
* Team Members:SARJANAA S N,NITHYA DEVI,SAI DHARSHINI P,VAISHNAVI S
  
  

---

# 2. Problem Statement

Traditional methods of storing wills and important digital asset information are often paper-based or scattered across multiple platforms. This makes it difficult for users to organize, update, and securely manage their personal assets and nominee details. There is a need for a centralized digital platform where users can securely manage their digital will information and related records.
---

# 3. Proposed Solution

The project provides a web application where users can register, log in, and access a dashboard to manage their digital will information. The application stores the data in MongoDB and provides different modules for managing user-related records.

---

# 4. Features Implemented

Based on the current code, the following features are available:

* User Registration
* User Login
* Dashboard
* Create and manage digital assets
* Add and manage nominees
* Create emergency requests
* View dashboard statistics
* User profile management
* Activity logging
* Backend health check



# 5. Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

---

# 6. System Architecture
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/123a86f0-633e-46d0-9b53-f026deeba9c0" />



# 7. Workflow

1. The user opens the application.
2. The user registers or logs into the system.
3. The dashboard is displayed.
4. The user can add and manage digital assets.
5. The user can add nominee information.
6. Emergency requests can be created and viewed.
7. The application stores and retrieves data from MongoDB.

---

# 8. Folder Structure

```text
DigitalWill

├── frontend
│   ├── src
│   ├── public
│   └── App.jsx
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── utils
│   └── server.js
│
└── README
```

---

# 9. Installation

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 10. Database

The project currently uses the following MongoDB collections:

* Users
* Assets
* Nominees
* Emergency Requests
* Audit Logs

---

# 11. Security Measures

The current implementation includes:

* Password hashing
* Protected API routes
* Basic input validation

---

# 12. Testing

The implemented modules tested include:

* Registration
* Login
* Dashboard
* Asset management
* Nominee management
* Emergency request management

---

# 13. Challenges Faced

* Connecting the React frontend with the Express backend
* Designing the MongoDB database
* Implementing CRUD operations
* Managing multiple modules within a single application

---

# 14. Future Scope

* PDF generation for digital wills
* Digital signatures
* Advanced Asset Management
* Document Upload
* Profile Management

  15.REFERENCES
 1. Sitkoff, R. H., & Dukeminier, J. (2021). Wills, Trusts, and Estates (11th ed.). Wolters Kluwer.
 2.Catherine Hodder. (2016). Digital Legacy and Digital Estate Planning. Law Brief Publishing.



