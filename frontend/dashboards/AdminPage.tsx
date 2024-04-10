import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfileSection from '../components/ProfileSection';
import { useRouter } from 'next/router';

interface CourseUpdateRequest {
    _id: string;
    username: string;
    course: string;
    verified: boolean;
}

interface UserRegistration {
    username: string;
    email: string;
    courses?: string[]; // Define courses property as an optional array of strings
}


interface Course {
    _id: string;
    name: string;
    // Add other properties as needed
}

interface Props {
    username: string;
}

const AdminPage: React.FC<Props> = ({username}) => {
    const [courseRequests, setCourseRequests] = useState<CourseUpdateRequest[]>([]);
    const [students, setStudents] = useState<UserRegistration[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeMenu, setActiveMenu] = useState<string>('requests');
    const [showAddCourseDialog, setShowAddCourseDialog] = useState<boolean>(false);
    const [newCourseName, setNewCourseName] = useState<string>('');
    const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchCourseRequests();
        fetchStudents();
        fetchCourses();
    }, []);

    const fetchCourseRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<CourseUpdateRequest[]>('http://localhost:8080/api/requests', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                setCourseRequests(response.data || []);
            } else {
                console.error('Error fetching course requests:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching course requests:', error);
        }
    };

    // Inside the fetchStudents function
const fetchStudents = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get<UserRegistration[]>('http://localhost:8080/api/students', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 200) {
            setStudents(response.data || []);
            // Fetch courses for each student
            await Promise.all(response.data.map(async (student) => {
                try {
                    const coursesResponse = await axios.get<Course[]>(`http://localhost:8080/api/students/${student.username}/courses`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (coursesResponse.status === 200) {
                        if (Array.isArray(coursesResponse.data)) {
                            // Update student object to include courses
                            setStudents(prevStudents => {
                                const updatedStudents = prevStudents.map(prevStudent => {
                                    if (prevStudent.username === student.username) {
                                        return {
                                            ...prevStudent,
                                            courses: coursesResponse.data.map(course => course.name),
                                        };
                                    }
                                    return prevStudent;
                                });
                                return updatedStudents;
                            });
                        } else {
                            console.error(`Error fetching courses for ${student.username}: Courses data is not an array`);
                        }
                    } else {
                        console.error(`Error fetching courses for ${student.username}:`, coursesResponse.statusText);
                    }
                } catch (error) {
                    console.error(`Error fetching courses for ${student.username}:`, error);
                }
            }));
        } else {
            console.error('Error fetching students:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching students:', error);
    }
};



const fetchStudentDetails = async (username: string) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8080/api/students/${username}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 200) {
            setSelectedStudentDetails(response.data);
        } else {
            console.error(`Error fetching details for ${username}:`, response.statusText);
        }
    } catch (error) {
        console.error(`Error fetching details for ${username}:`, error);
    }
};
    

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<Course[]>('http://localhost:8080/api/courses', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                setCourses(response.data || []);
            } else {
                console.error('Error fetching courses:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleAddCourse = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/courses',
                { name: newCourseName },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                console.log('Course added successfully');
                fetchCourses();
                setShowAddCourseDialog(false); // Close the dialog after successful addition
            } else {
                console.error('Error adding course:', response.data.error);
            }
        } catch (error) {
            console.error('Error adding course:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const handleApproveRequest = async (request: CourseUpdateRequest) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/update-course-verification',
                { username: request.username, course: request.course, verified: true },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                console.log('Course request approved successfully');
                fetchCourseRequests();
            } else {
                console.error('Error approving course request:', response.data.error);
            }
        } catch (error) {
            console.error('Error approving course request:', error);
        }
    };

    const handleDenyRequest = async (request: CourseUpdateRequest) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/update-course-verification',
                { username: request.username, course: request.course, verified: false },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                console.log('Course request denied successfully');
                fetchCourseRequests();
            } else {
                console.error('Error denying course request:', response.data.error);
            }
        } catch (error) {
            console.error('Error denying course request:', error);
        }
    };

    const renderMenu = () => {
        return (
            <div className="flex justify-center mb-4">
                <button
                    className={`mr-4 px-4 py-2 text-black rounded-lg focus:outline-none ${activeMenu === 'requests' ? 'bg-blue-500 text-white' : 'bg-white text-blue-600'}`}
                    onClick={() => setActiveMenu('requests')}
                >
                    Requests
                </button>
                &nbsp;
                <button
                    className={`mr-4 px-4 py-2 text-black rounded-lg focus:outline-none ${activeMenu === 'students' ? 'bg-blue-500 text-white' : 'bg-white text-blue-600'}`}
                    onClick={() => setActiveMenu('students')}
                >
                    Students
                </button>
                &nbsp;
                <button
                    className={`mr-4 px-4 py-2 text-black rounded-lg focus:outline-none ${activeMenu === 'courses' ? 'bg-blue-500 text-white' : 'bg-white text-blue-600'}`}
                    onClick={() => setActiveMenu('courses')}
                >
                    Courses
                </button>
            </div>
        );
    };
    
    
    

    return (
        <div className="container mx-auto mt-8 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-6xl py-4 font-bold text-center mb-4 flex-grow">Admin Dashboard</h1>
                <div>
                    <ProfileSection username={username} handleLogout={handleLogout} />
                </div>
            </div>

            {renderMenu()}

            {activeMenu === 'requests' && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Course Requests</h2>
                    <ul>
                        {courseRequests.map((request, index) => (
                            <li key={index} className="mb-4">
                                <div>
                                    <span>Username: {request.username}</span>
                                    <br />
                                    <span>Course: {request.course}</span>
                                    <br />
                                    <span>Status: {request.verified ? 'Approved' : 'Pending'}</span>
                                </div>
                                <div className="mt-2">
                                    {!request.verified && (
                                        <>
                                            <button onClick={() => handleApproveRequest(request)} className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300 mr-2">
                                                Approve
                                            </button>
                                            <button onClick={() => handleDenyRequest(request)} className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-300">
                                                Deny
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

{activeMenu === 'students' && (
    <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Students List</h2>
        <ul>
            {students.map((student, index) => (
                <div className='bg-white text-black rounded-md px-4' key={index}>
                    <li className="mb-4">
                        <div>
                            <span><b>Username: </b>{student.username}</span>
                        </div>
                        {student.courses && (
                            <div>
                                <span><b>Courses:</b></span>
                                <ul>
                                    {student.courses.map((course, index) => (
                                        <li key={index}>{course}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* Add button to fetch additional details */}
                        <div className="mt-2">
                            <button onClick={() => fetchStudentDetails(student.username)} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 mr-2">
                                View Details
                            </button>
                        </div>
                    </li>
                </div>
            ))}
        </ul>
        {/* Display selected student details */}
        {selectedStudentDetails && (
            <div className="mt-4">
                <h3 className="text-xl font-bold mb-2">Selected Student Details</h3>
                <div>
                    <p><b>Username:</b> {selectedStudentDetails.username}</p>
                    {/* Display other details as needed */}
                </div>
            </div>
        )}
    </div>
)}


            {activeMenu === 'courses' && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Courses</h2>
                    <div className="flex justify-end mb-4"> {/* Adjusted here */}
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                            onClick={() => setShowAddCourseDialog(true)}
                        >
                            Add New Course
                        </button>
                    </div>
                    <ul>
                        {courses.map((course, index) => (
                            <li key={index} className="mb-4">
                                <div>
                                    <span>Course Name: {course.name}</span>
                                    {/* Display other course details as needed */}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Dialog for adding a new course */}
            {showAddCourseDialog && (
                <div className="fixed text-black top-0 left-0 w-full h-full flex items-center justify-center z-50">
                    <div className="bg-white w-96 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Add New Course</h2>
                        <input
                            type="text"
                            className="border border-gray-300 rounded-md px-3 py-2 w-full mb-4"
                            placeholder="Enter course name"
                            value={newCourseName}
                            onChange={(e) => setNewCourseName(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 mr-2"
                                onClick={() => handleAddCourse()}
                            >
                                Add
                            </button>
                            <button
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-300"
                                onClick={() => setShowAddCourseDialog(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
