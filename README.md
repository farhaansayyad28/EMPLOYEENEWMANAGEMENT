# PeopleDesk — Employee Management System

A small MERN CRUD project. Add, view, edit, and delete employee records with a React/Vite interface, an Express API, and MongoDB storage.

The learning document uses a Student Management System as its example. This project uses employees instead, while demonstrating the same MERN architecture and CRUD/API concepts. It uses the MongoDB database `employee_management` and creates collections for employees, departments, attendance, and leave requests.

## Employee fields

- Name
- Email (must be unique)
- Department
- Role / job title
- Phone and work location
- Employment type (full-time, part-time, contract, or intern)
- Status (active, on leave, or inactive)
- Start date and optional internal notes

The directory includes search, department and status filters, sorting, pagination, employee profiles, and CSV export. Employment status can be changed from the employee row menu; records can also be permanently deleted after confirmation.

## Management modules

- **Overview:** headcount, active employees, employees on leave, new hires, recent team members, and department distribution.
- **People → Employee directory:** employee profiles, add/edit/delete, search, filters, sorting, and pagination.
- **People → Departments:** create teams, add descriptions, review department headcount, and remove empty departments.
- **Time & leave → Attendance:** record each active employee as present, late, absent, or working from home for a selected date. Daily registers are saved in MongoDB.
- **Time & leave → Leave requests:** submit time-off requests and approve or decline pending requests.
- **Reports:** employee CSV export and a workforce summary. The SOAP XML example remains available as a separate API learning demo.

## Requirements

- Node.js and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

### Windows quick setup

1. Download the project from GitHub with **Code → Download ZIP**, then extract it and open the `employee-management` folder in Command Prompt or PowerShell.
2. Install Node.js (which includes npm) and make sure MongoDB Community Server is installed and running locally. MongoDB Compass is optional; it is only a graphical viewer.
3. Install the project dependencies:

   ```cmd
   npm run install:all
   ```

4. Create the backend environment file. In **Command Prompt**, run:

   ```cmd
   copy server\.env.example server\.env
   notepad server\.env
   ```

   In **PowerShell**, use:

   ```powershell
   Copy-Item server/.env.example server/.env
   notepad server/.env
   ```

   Save the file with these settings for local MongoDB:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/employee_management
   JWT_SECRET=replace-this-with-a-long-random-secret
   ```

   Save it as `server/.env` (make sure Windows has not added `.txt`). The `.env` file is local and is not included in GitHub; each person creates their own.

5. Start the app from the project folder:

   ```cmd
   npm run dev
   ```

6. Open `http://localhost:5173` and create an account. MongoDB creates the `employee_management` database and its collections as you use the modules.

If using MongoDB Atlas instead, put the Atlas connection string in `MONGODB_URI` and keep it private. The rest of the steps are the same.

### macOS/Linux or general setup

1. Open a terminal in the `employee-management` folder.
2. Install all project dependencies:

   ```bash
   npm run install:all
   ```

3. Copy `server/.env.example` to `server/.env`. For local MongoDB, set:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/employee_management
   JWT_SECRET=use-a-long-random-secret-value
   ```

   For MongoDB Atlas, replace the URI with your cluster connection string. Keep the URI private.

4. Start MongoDB if you are using a local installation.
5. Start both the API and frontend:

   ```bash
   npm run dev
   ```

6. Open the Vite URL printed in the terminal, usually `http://localhost:5173`.
7. Choose **Create an account** on the sign-in page, register once, then add employee records. The password must be at least 8 characters.

The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health` to confirm it is responding.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/employees` | List employees |
| POST | `/api/employees` | Add an employee |
| PUT | `/api/employees/:id` | Edit an employee |
| DELETE | `/api/employees/:id` | Delete an employee |
| GET | `/api/employees/export/csv` | Download an employee CSV with profile and status fields (requires sign-in) |
| GET, POST | `/api/departments` | List departments or add a department |
| PUT, DELETE | `/api/departments/:id` | Edit or delete an empty department |
| GET | `/api/attendance?date=YYYY-MM-DD` | View the daily attendance register |
| PUT | `/api/attendance/day` | Save the selected day's attendance records |
| GET, POST | `/api/leave-requests` | List leave requests or create one |
| PATCH | `/api/leave-requests/:id/status` | Approve or decline a request |
| DELETE | `/api/leave-requests/:id` | Delete a leave request |
| POST | `/api/auth/register` | Create an account; password is stored as a bcrypt hash |
| POST | `/api/auth/login` | Sign in and receive a 12-hour JWT |
| POST | `/api/soap` | SOAP XML demo that returns employees (requires sign-in) |

Employee routes require the bearer token returned by login or registration. The React app attaches it automatically and provides a sign-out button. For this class project, registration is open; there are no role-based permissions.

The **Export CSV** button downloads `employees.csv` in the browser and writes a server-side copy to `server/exports/employees.csv` using Node's file-system module. The **SOAP demo** button sends a SOAP XML `GetEmployees` request; the response is an XML SOAP envelope. The main app still uses REST/JSON for its regular CRUD operations.

These routes use the same REST pattern as `/students`: the resource name is `employees`, and the HTTP methods perform Create, Read, Update, and Delete.

## How this project maps to the MERN learning document

| Document concept | Where it appears here |
|---|---|
| MongoDB → Express/Node → React architecture | MongoDB stores records; the Express API in `server/src` accesses them through Mongoose; the Vite React app in `client/src` calls that API with Axios. |
| Database → collection → document | Database `employee_management` → collection `employees` → one employee per document. MongoDB adds each document's `_id`. |
| Related HR modules | Separate Mongoose models persist departments, daily attendance, and leave requests in their own MongoDB collections. |
| Mongoose schema/model | `server/src/models/Employee.js` defines the employee fields, validation, and model. |
| REST CRUD APIs | `server/src/routes/employees.js` implements GET, POST, PUT, and DELETE. |
| Express routing, middleware, requests, responses, and errors | `server/src/server.js` sets up CORS, JSON parsing, health/API routes, and error handling. The router reads request bodies and URL IDs, then returns JSON and HTTP status codes. |
| React components, JSX, props | `App` renders the page; the reusable `SummaryCard` receives its icon, label, tone, and value as props. |
| React state, `useState`, `useEffect`, forms, and events | `App.jsx` stores the directory/form/search state, loads data on page open, and handles form input and button actions. |
| Axios and JSON request flow | The frontend calls the `/api/employees` routes; Axios sends/receives JSON between React and Express. |
| JavaScript ES6, arrays, `map`, `filter`, promises, `async`/`await` | The app uses `const`, arrow functions, object/array operations, `map`, `filter`, and `async`/`await` around Axios and Mongoose calls. |
| Search, filtering, and dashboard | Search covers employee name, email, role, and department; department is the equivalent of the document's course filter; summary cards show directory totals. |

### Core practical requirements versus optional topics

The working app covers the core practical: React → Axios → Express/Node → Mongoose → MongoDB, plus Create, Read, Update, and Delete. Adding an employee is the equivalent of registering a record. It also includes account registration and login, a SOAP XML read demo, and CSV export through Node's file-system module.

The app's regular modules use REST/JSON. The SOAP button is a separate comparison/demo feature, not a replacement for REST. RESTless APIs remain a theory topic for the viva. Node architecture is also a study concept, while CSV export demonstrates the file-system module in practice.

## Quick demo checklist

1. Create an account, then sign in.
2. Add an employee with contact, department, job, status, and start-date details.
3. Check that the employee appears and the dashboard counts update.
4. Search, filter by department or status, sort the directory, and move between pages.
5. Open the employee profile, edit details, and try the row menu to change status.
6. Add a department, then open **Attendance**, mark the team, and save the daily register.
7. Create a leave request and approve or decline it from the request list.
8. Open **Reports** to export the employee CSV and view the workforce summary; run the SOAP demo if required for class.
9. Delete a test employee and confirm the row disappears.
10. Sign out and sign back in; employee and module data should still be saved.

## Viva explanation

“This is a PeopleDesk HR management system built with the MERN stack. React provides the interface and Axios sends requests to an Express API running on Node.js. Mongoose stores employees, departments, attendance, and leave requests in MongoDB. I implemented employee CRUD, department management, daily attendance, leave approvals, search, filters, sorting, pagination, employee profiles, and CSV reports. Accounts use bcrypt-hashed passwords and JWT-protected API routes. The everyday modules use REST/JSON; a separate SOAP XML demo shows the difference between the two API styles.”

### Short theory answers to prepare

- **MERN:** MongoDB stores data, Express handles API routes, React builds the interface, and Node.js runs the backend JavaScript.
- **Mongoose:** Defines the document model and provides methods for working with MongoDB.
- **Axios:** Sends HTTP requests from the React frontend to the backend and receives JSON responses.
- **REST:** Organizes an API around resources and uses HTTP methods such as GET, POST, PUT, and DELETE. This project uses REST for the `employees` resource.
- **SOAP:** A different web-service protocol that uses structured XML messages, commonly described using Envelope, Header, Body, and optional Fault elements. This project includes a small SOAP XML demo; regular management modules use REST/JSON.

### Simple request flow

```text
React form → Axios → Express route → Mongoose model → MongoDB
React directory ← JSON response ← Express API ← MongoDB
```
