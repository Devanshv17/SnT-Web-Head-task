package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

var (
	registeredUsers   *mongo.Collection
	courseCollection  *mongo.Collection
	requestCollection *mongo.Collection
	ctx               = context.TODO()
	jwtKey            = []byte("3J&59#sM%5D+^!Y$BXu@2pPw@sn#ZjF")
	adminSecurityCode string
)

// Claims structure for JWT token
type Claims struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.StandardClaims
}

type UserRegistration struct {
	Username     string   `json:"username" binding:"required"`
	Password     string   `json:"password" binding:"required"`
	Role         string   `json:"role" binding:"required"`
	IsVerified   bool     `json:"isVerified"`
	OTP          string   `json:"otp"`
	Courses      []string `json:"courses,omitempty"`
	SecurityCode string   `json:"securityCode"`
	Verified     []bool   `json:"verified,omitempty"`
}

type CourseUpdateRequest struct {
	Username string `json:"username" binding:"required"`
	Course   string `json:"course" binding:"required"`
	Verified bool   `json:"verified"`
}

type Course struct {
	Name string `json:"name" bson:"name"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	adminSecurityCode = os.Getenv("SECURITY_CODE")

	client, err := mongo.NewClient(options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	if err != nil {
		log.Fatal(err)
	}
	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	courseDB := client.Database("ListofCourse")
	courseCollection = courseDB.Collection("details")

	registerDB := client.Database("Userdata")
	registeredUsers = registerDB.Collection("registered_users")

	requestDB := client.Database("CourseUpdateRequest")
	requestCollection = requestDB.Collection("course_requests")

	r := gin.Default()

	// Use CORS middleware with custom configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://example.com", "http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE"}
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")

	r.Use(cors.New(config))

	r.POST("/api/login", login)
	r.POST("/api/register", register)
	r.POST("/api/verify", verifyOTP)
	r.GET("/api/students", getStudentsList)
	r.GET("/api/courses", fetchCourses)
	r.POST("/api/courses", uploadCourse)
	r.DELETE("/api/courses/:name", deleteCourse)
	r.GET("/api/students/:username", getStudentDetails)
	r.GET("/api/students/:username/courses", getStudentCourses)
	r.DELETE("/api/students/:username/courses/:course", deleteCourseForStudent)
	r.POST("/api/add-course", addCourseToStudent)
	r.POST("/api/update-course-verification", updateCourseVerificationStatus)
	r.GET("/api/requests", getCourseRequests)

	if err := r.Run("0.0.0.0:8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
func register(c *gin.Context) {
	var user UserRegistration
	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if the username already exists in the database
	count, err := registeredUsers.CountDocuments(ctx, bson.M{"username": user.Username})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check username availability"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}

	// Check if the user is registering as an admin with the correct security code
	if user.Role == "admin" && user.SecurityCode != adminSecurityCode {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect security code for admin registration"})
		return
	}

	// Generate a random 6-digit OTP
	rand.Seed(time.Now().UnixNano())
	otp := strconv.Itoa(rand.Intn(900000) + 100000) // Generates a random number between 100000 and 999999

	// Hash the password before storing it in the database
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Store user registration data in the database along with the OTP
	_, err = registeredUsers.InsertOne(ctx, bson.M{
		"username":   user.Username,
		"password":   string(hashedPassword),
		"role":       user.Role,
		"isVerified": false,
		"otp":        otp,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	// Send OTP to the user's email address
	if err := sendVerificationOTP(user.Username, otp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully. Please verify your email to activate your account"})
}

func verifyOTP(c *gin.Context) {
	type OTPRequest struct {
		Username string `json:"username" binding:"required"`
		OTP      string `json:"otp" binding:"required"`
	}

	var req OTPRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Query the database to find the user by username
	var dbUser UserRegistration
	err := registeredUsers.FindOne(ctx, bson.M{"username": req.Username}).Decode(&dbUser)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if the provided OTP matches the stored OTP
	if req.OTP != dbUser.OTP {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid OTP"})
		return
	}

	// Update the user's verification status to true
	_, err = registeredUsers.UpdateOne(ctx, bson.M{"username": req.Username}, bson.M{"$set": bson.M{"isVerified": true}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP verified successfully"})
}

func sendVerificationOTP(email, otp string) error {
	// SMTP configuration
	smtpHost := "mmtp.iitk.ac.in"
	smtpPort := 25
	smtpUsername := os.Getenv("SMTP_USERNAME")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	// Sender and recipient email addresses
	from := "EduWise@iitk.ac.in"
	to := email

	// Email content
	subject := "Account Verification OTP"
	body := fmt.Sprintf("Dear User your verification OTP is: %s", otp)

	// Constructing email headers
	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/plain; charset=\"utf-8\""
	headers["Content-Transfer-Encoding"] = "base64"

	var msg bytes.Buffer
	for key, value := range headers {
		msg.WriteString(key + ": " + value + "\r\n")
	}
	msg.WriteString("\r\n" + base64.StdEncoding.EncodeToString([]byte(body)))

	// SMTP authentication
	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, smtpHost)

	// Sending email using SMTP
	err := smtp.SendMail(fmt.Sprintf("%s:%d", smtpHost, smtpPort), auth, from, []string{to}, msg.Bytes())
	if err != nil {
		return err
	}

	return nil
}

func login(c *gin.Context) {
	var user struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Query the database to find the user by username
	var dbUser UserRegistration
	err := registeredUsers.FindOne(ctx, bson.M{"username": user.Username}).Decode(&dbUser)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Check if the user is verified
	if !dbUser.IsVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account not verified. Please check your email for verification instructions."})
		return
	}

	// Compare the provided password with the hashed password from the database
	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Generate JWT token
	tokenString, err := generateJWT(user.Username, dbUser.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate JWT token"})
		return
	}

	// Return JWT token to the client
	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

// Function to generate JWT token
func generateJWT(username, role string) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // Token valid for 7 days

	claims := &Claims{
		Username: username,
		Role:     role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// Function to check user role based on JWT token
func checkRole(c *gin.Context, expectedRole string) bool {
	// Extract JWT token from the request header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is missing"})
		return false
	}

	tokenString := authHeader[len("Bearer "):]

	// Parse and validate JWT token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid JWT token"})
		return false
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid JWT claims"})
		return false
	}

	// Check if the user role matches the expected role
	if claims.Role != expectedRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access"})
		return false
	}

	return true
}

func getStudentsList(c *gin.Context) {
	// Check if the user is an admin
	if !checkRole(c, "admin") {
		return
	}

	// Query the database to retrieve the list of students
	cursor, err := registeredUsers.Find(ctx, bson.M{"role": "student"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students list"})
		return
	}
	defer cursor.Close(ctx)

	var students []UserRegistration
	if err := cursor.All(ctx, &students); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode students list"})
		return
	}

	c.JSON(http.StatusOK, students)
}

func uploadCourse(c *gin.Context) {
	// Check if the user is an admin
	if !checkRole(c, "admin") {
		return
	}

	var course Course
	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if the course with the same name already exists in the database
	count, err := courseCollection.CountDocuments(ctx, bson.M{"name": course.Name})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check course existence"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Course with the same name already exists"})
		return
	}

	_, err = courseCollection.InsertOne(ctx, course)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store course data in database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Course data uploaded successfully"})
}

func fetchCourses(c *gin.Context) {
	var courses []Course // Assuming you have a struct definition for Course similar to Faculty

	cursor, err := courseCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch course data from database"})
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var course Course
		if err := cursor.Decode(&course); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode course data"})
			return
		}
		courses = append(courses, course)
	}

	if err := cursor.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cursor error"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

func deleteCourse(c *gin.Context) {
	// Check if the user is an admin
	if !checkRole(c, "admin") {
		return
	}

	// Extract course name from the request parameters
	courseName := c.Param("name")

	// Delete the course from the database
	result, err := courseCollection.DeleteOne(ctx, bson.M{"name": courseName})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete course"})
		log.Printf("Failed to delete course '%s' from the database: %v", courseName, err)
		return
	}

	// Check if the course was found and deleted
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		log.Printf("Course '%s' not found in the database", courseName)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Course deleted successfully"})
	log.Printf("Course '%s' deleted successfully", courseName)
}

func getStudentDetails(c *gin.Context) {
	// Check if the user is an admin
	if !checkRole(c, "admin") {
		return
	}

	// Get student username from request parameters
	username := c.Param("username")

	// Query the database to retrieve details of the student by username
	var student UserRegistration
	err := registeredUsers.FindOne(ctx, bson.M{"username": username}).Decode(&student)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch student details"})
		return
	}

	c.JSON(http.StatusOK, student)
}

func addCourseToStudent(c *gin.Context) {
	var req CourseUpdateRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if the provided student username exists
	var student UserRegistration
	err := registeredUsers.FindOne(ctx, bson.M{"username": req.Username}).Decode(&student)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Create a new request record for the course
	_, err = requestCollection.InsertOne(ctx, bson.M{
		"username": req.Username,
		"course":   req.Course,
		"verified": false, // Set verified status to false initially
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Course request submitted for verification"})
}

// Route for admin to update course verification status
func updateCourseVerificationStatus(c *gin.Context) {
	// Check if the user is an admin
	if !checkRole(c, "admin") {
		return
	}

	var req CourseUpdateRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if the provided request exists
	var request CourseUpdateRequest
	err := requestCollection.FindOne(ctx, bson.M{"username": req.Username, "course": req.Course}).Decode(&request)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// Update the verification status of the request
	update := bson.M{"$set": bson.M{"verified": req.Verified}}
	_, err = requestCollection.UpdateOne(ctx, bson.M{"username": req.Username, "course": req.Course}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update course verification status"})
		return
	}

	if req.Verified {
		// Add the course to the student's courses
		studentUpdate := bson.M{"$push": bson.M{"courses": req.Course, "verified": req.Verified}}
		_, err := registeredUsers.UpdateOne(ctx, bson.M{"username": req.Username}, studentUpdate)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update student courses"})
			return
		}

		// Delete the request from the request collection
		_, err = requestCollection.DeleteOne(ctx, bson.M{"username": req.Username, "course": req.Course})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete course request"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Course verification status updated successfully and added to student's courses"})
	} else {
		// If the request is denied, simply delete the request
		_, err = requestCollection.DeleteOne(ctx, bson.M{"username": req.Username, "course": req.Course})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete course request"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Course verification status updated successfully"})
	}
}

func deleteCourseForStudent(c *gin.Context) {
	var req CourseUpdateRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if the provided student username exists
	var student UserRegistration
	err := registeredUsers.FindOne(ctx, bson.M{"username": req.Username}).Decode(&student)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Find the index of the course to delete
	index := -1
	for i, course := range student.Courses {
		if course == req.Course {
			index = i
			break
		}
	}

	// If course found, delete it
	if index != -1 {
		student.Courses = append(student.Courses[:index], student.Courses[index+1:]...)
		student.Verified = append(student.Verified[:index], student.Verified[index+1:]...)

		// Update the student's document in the database
		update := bson.M{"$set": bson.M{"courses": student.Courses, "verified": student.Verified}}
		_, err = registeredUsers.UpdateOne(ctx, bson.M{"username": req.Username}, update)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete course for student"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Course deleted for student successfully"})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Student is not enrolled in the requested course"})
	}
}

func getStudentCourses(c *gin.Context) {
	// Extract JWT token from the request header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is missing"})
		return
	}
	tokenString := authHeader[len("Bearer "):]

	// Parse and validate JWT token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid JWT token"})
		return
	}

	// Check if the token is valid and claims are present
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid JWT claims"})
		return
	}

	// Log the extracted username and role
	fmt.Printf("Username: %s, Role: %s\n", claims.Username, claims.Role)

	// Get the requested username from the request parameters
	requestedUsername := c.Param("username")

	// Check if the user is authorized as an admin or if they are the correct user
	if claims.Role != "admin" && claims.Role != "student" && claims.Username != requestedUsername {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access"})
		return
	}

	if claims.Role == "student" && claims.Username != requestedUsername {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access to another student's data"})
		return
	}

	// Query the database to retrieve details of the student by username
	var student UserRegistration
	err = registeredUsers.FindOne(ctx, bson.M{"username": requestedUsername}).Decode(&student)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch student details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"courses": student.Courses})
}

func getCourseRequests(c *gin.Context) {
	// Check if the user is an admin
	if !checkRole(c, "admin") {
		return
	}

	// Query the database to retrieve course requests
	cursor, err := requestCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch course requests"})
		return
	}
	defer cursor.Close(ctx)

	var requests []CourseUpdateRequest
	if err := cursor.All(ctx, &requests); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode course requests"})
		return
	}

	c.JSON(http.StatusOK, requests)
}
