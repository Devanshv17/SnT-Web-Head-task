import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadForm from '../components/UploadForm';
import ProfileSection from '../components/ProfileSection';
import { useRouter } from 'next/router';

interface CourseUpdateRequest {
    _id: string;
    username: string;
    course: string;
    verified: boolean;
}

const MainPage: React.FC = () => {
    const [courses, setCourses] = useState<string[]>([]);
    const [courseRequests, setCourseRequests] = useState<CourseUpdateRequest[]>([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    const [requestedCourse, setRequestedCourse] = useState('');
    const [username, setUsername] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('');
    const [selectedRequest, setSelectedRequest] = useState<CourseUpdateRequest | null>(null);
    const router = useRouter();

    useEffect(() => {
        setUsername(getUsernameFromToken());
        setUserRole(getUserRoleFromToken());
    }, []);

    useEffect(() => {
        if (username) {
            fetchStudentCourses();
        }
    }, [username]);

    useEffect(() => {
        if (userRole === 'admin') {
            fetchCourseRequests();
        }
    }, [userRole]);

    const fetchStudentCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<{ courses: string[] }>(`http://localhost:8080/api/students/${username}/courses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                setCourses(response.data.courses || []);
            } else {
                console.error('Error fetching student courses:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching student courses:', error);
        }
    };

    const getUsernameFromToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            return tokenPayload.username;
        }
        return '';
    };

    const getUserRoleFromToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            return tokenPayload.role;
        }
        return '';
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const handleToggleForm = () => {
        setShowUploadForm(prevState => !prevState);
    };

    const isLoggedIn = () => {
        const token = localStorage.getItem('token');
        return !!token;
    };

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

    const handleRequestCourse = () => {
        setShowRequestDialog(true);
    };

    const handleCloseDialog = () => {
        setShowRequestDialog(false);
    };

    const handleRequestDialogSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:8080/api/add-course`, { username, course: requestedCourse }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                console.log('Course requested successfully');
                setShowRequestDialog(false);
                fetchStudentCourses();
            } else {
                console.error('Error requesting course:', response.statusText);
            }
        } catch (error) {
            console.error('Error requesting course:', error);
        }
    };

    const handleSelectRequest = (request: CourseUpdateRequest) => {
        setSelectedRequest(request);
    };

    return (
        <div className="container mx-auto mt-8 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-6xl py-4 font-bold text-center mb-4 flex-grow">{userRole === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}</h1>
                <div>
                    <ProfileSection username={username} handleLogout={handleLogout} />
                </div>
            </div>

            <div className="mb-8 text-right">
                {userRole === 'admin' && (
                    <button onClick={handleToggleForm} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
                        {showUploadForm ? 'Close Form' : 'Upload Files'}
                    </button>
                )}
            </div>

            {showUploadForm && userRole === 'admin' && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 bg-white p-8 rounded-2xl shadow-lg">
                    <UploadForm username={username} fetchStudentCourses={fetchStudentCourses} onClose={() => setShowUploadForm(false)} />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="table-auto border-collapse border border-gray-400">
                    <thead>
                        <tr>
                            <th className="border border-gray-400 px-4 py-2">Course Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course, index) => (
                            <tr key={index}>
                                <td className="border border-gray-400 px-4 py-2">{course}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {userRole === 'student' && (
                <div className="text-center mt-4">
                    <button onClick={handleRequestCourse} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
                        Request Course
                    </button>
                </div>
            )}

            {/* Modal Dialog for requesting course */}
            {showRequestDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 bg-white p-8 rounded-2xl shadow-lg">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Request Course</h2>
                        <input
                            type="text"
                            className="border border-gray-300 rounded-md p-2 w-full mb-4"
                            placeholder="Enter course name"
                            value={requestedCourse}
                            onChange={(e) => setRequestedCourse(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <button onClick={handleCloseDialog} className="mr-2 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-300">
                                Cancel
                            </button>
                            <button onClick={handleRequestDialogSubmit} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
                                Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Course Requests for Admin */}
            {userRole === 'admin' && (
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
        </div>
    );
};

export default MainPage;
