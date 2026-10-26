# PeopleDesk — Employee Management System

A small MERN CRUD project. Add, view, edit, and delete employee records with a React/Vite interface, an Express API, and MongoDB storage.

The learning document uses a Student Management System as its example. This project uses employees instead, while demonstrating the same MERN architecture and CRUD/API concepts. It intentionally uses the database `employee_management`, collection `employees`, and employee fields below.

## Employee fields

- Name
- Email (must be unique)
- Department
- Role / job title

## Requirements

- Node.js and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

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
| GET | `/api/employees/export/csv` | Create and download an employee CSV (requires sign-in) |
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

The main CRUD interface uses REST/JSON. The SOAP button is a small comparison/demo feature, not a replacement for the REST API. The project does not use RESTless APIs; that remains a theory topic for the viva. Node architecture is also a study concept, while the CSV export demonstrates the file-system module in practice.

## Quick demo checklist

1. Create an account, then sign in.
2. Add an employee with all four fields.
3. Check that the new employee appears and the summary counts update.
4. Search by name or email; filter by department.
5. Edit the role and save.
6. Export the CSV and press **SOAP demo** to verify both additional features.
7. Delete the employee and confirm the row disappears.
8. Sign out and sign back in; the employee record should still be saved.

## Viva explanation

“This is an Employee Management System built with the MERN stack. React provides the user interface and Axios sends requests to an Express API running on Node.js. Mongoose validates and stores employee documents in MongoDB. I implemented CRUD with POST, GET, PUT, and DELETE. Accounts register and sign in through an API; passwords are hashed with bcrypt and the backend protects employee routes with a JWT. I also added a CSV export using Node's file-system module and a SOAP XML demo route to compare SOAP with the REST/JSON API used by the app.”

### Short theory answers to prepare

- **MERN:** MongoDB stores data, Express handles API routes, React builds the interface, and Node.js runs the backend JavaScript.
- **Mongoose:** Defines the document model and provides methods for working with MongoDB.
- **Axios:** Sends HTTP requests from the React frontend to the backend and receives JSON responses.
- **REST:** Organizes an API around resources and uses HTTP methods such as GET, POST, PUT, and DELETE. This project uses REST for the `employees` resource.
- **SOAP:** A different web-service protocol that uses structured XML messages, commonly described using Envelope, Header, Body, and optional Fault elements. This app does not use SOAP.

### Simple request flow

```text
React form → Axios → Express route → Mongoose model → MongoDB
React directory ← JSON response ← Express API ← MongoDB
```
