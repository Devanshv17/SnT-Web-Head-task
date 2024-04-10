# README

## Backend Setup

1. Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2. Create a `.env` file by running:
    ```bash
    touch .env
    ```
   Or directly add environment variables in `.env` with the following details:

    ```plaintext
    MONGO_URI=mongodb+srv://your_username:your_password@cluster0.adahnkt.mongodb.net/?retryWrites=true&w=majority
    SMTP_USERNAME=your_smtp_username
    SMTP_PASSWORD=your_smtp_password
    SECURITY_CODE=your_security_code
    ```

   Replace `your_username`, `your_password`, `your_smtp_username`, `your_smtp_password`, and `your_security_code` with your actual credentials.

3. Run the backend server:
    ```bash
    go run main.go
    ```

## Frontend Setup

1. Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the frontend server:
    ```bash
    npm run dev
    ```

Now you should be able to access the backend and frontend of your application. Make sure to replace the placeholder credentials with your actual credentials before running the application.