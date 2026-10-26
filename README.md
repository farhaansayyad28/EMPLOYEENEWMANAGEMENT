# PeopleDesk — Employee Management System

A MERN application for managing employee records, departments, attendance, and leave requests.

## Features

- Employee create, view, edit, and delete (CRUD)
- Search and filter the employee directory
- Departments, attendance history, and leave requests
- Admin, Manager, and Employee access levels
- REST API using JSON; MongoDB stores the data

## Requirements

- Node.js and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

> MongoDB Compass is only a database viewer; it does not run the database server.

## Install and run on Windows

1. Download the repository using **Code → Download ZIP** and extract it, or clone it with Git:

   ```cmd
   git clone https://github.com/farhaansayyad28/EMPLOYEENEWMANAGEMENT.git
   cd EMPLOYEENEWMANAGEMENT
   ```

2. Open Command Prompt or PowerShell in the project folder (the folder containing the root `package.json`).
3. Install dependencies:

   ```cmd
   npm run install:all
   ```

4. Create the server environment file:

   ```cmd
   copy server\.env.example server\.env
   notepad server\.env
   ```

   Keep the local MongoDB settings below. Change `JWT_SECRET` to a long, private random value, then save the file as `server/.env` (not `server/.env.txt`).

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/employee_management
   JWT_SECRET=replace-this-with-a-long-random-secret
   ```

5. Start MongoDB Community Server. If you use Atlas instead, put your Atlas connection string in `MONGODB_URI` and keep it private.
6. Start the frontend and backend together:

   ```cmd
   npm run dev
   ```

7. Open **http://localhost:5173**. The API health page is **http://localhost:5000/api/health**.

The first account registered is Admin. Later accounts are Employees; an Admin can assign Manager or Admin roles in **Team access**.

## Optional: load sample data

With MongoDB running and `server/.env` configured, run this from the project folder:

```cmd
npm run seed:demo
```

Refresh the website. This adds five sample employees, attendance for today, and two leave requests. It is safe to run again and does not overwrite or delete existing records. It does not create login accounts.

## Database and request flow

The local database is `employee_management`, with separate collections for employees, departments, attendance, and leave requests. The app sends REST/JSON requests such as `GET`, `POST`, `PUT`, and `DELETE` on `/api/employees`.

```text
React + Axios → Express + Node.js → Mongoose → MongoDB
```

## Troubleshooting

- **`MONGODB_URI is missing`:** Make sure `server/.env` exists beside `server/package.json` and contains the settings above. Restart `npm run dev` after creating it.
- **MongoDB connection error:** Make sure MongoDB Community Server is running, or use a valid Atlas URI. Compass by itself is not the server.
- **The site is blank or stale:** Check the terminal for errors and refresh the page. The API should respond at `http://localhost:5000/api/health`.
