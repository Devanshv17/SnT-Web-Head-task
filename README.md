README

Backend Setup

Navigate to the backend directory:
bash
Copy code
cd backend
Create a .env file by running:
bash
Copy code
touch .env
Or directly add environment variables in .env with the following details:
plaintext
Copy code
MONGO_URI=<Your Mongo Deatails>
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SECURITY_CODE=your_security_code
Replace your_username, your_password, your_smtp_username, your_smtp_password, and your_security_code with your actual credentials.
Run the backend server:
bash
Copy code
go run main.go
Frontend Setup

Navigate to the frontend directory:
bash
Copy code
cd frontend
Install dependencies:
bash
Copy code
npm install
Start the frontend server:
bash
Copy code
npm run dev
Now you should be able to access the backend and frontend of your application. Make sure to replace the placeholder credentials with your actual credentials before running the application.