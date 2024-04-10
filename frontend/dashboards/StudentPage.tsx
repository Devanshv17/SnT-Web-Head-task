import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadForm from '../components/UploadForm';
import ProfileSection from '../components/ProfileSection';
import { useRouter } from 'next/router';

interface Props {
    username: string;
}

const StudentPage: React.FC<Props> = ({ username }) => {
    const [courses, setCourses] = useState<string[]>([]);
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    const [requestedCourse, setRequestedCourse] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchStudentCourses();
    }, [username]);

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
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

    return (
        <div className="container mx-auto mt-8 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-6xl py-4 font-bold text-center mb-4 flex-grow">Student Dashboard</h1>
                <div>
                    <ProfileSection username={username} handleLogout={handleLogout} />
                </div>
            </div>

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

            <div className="text-center mt-4">
                <button onClick={handleRequestCourse} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
                    Request Course
                </button>
            </div>

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
        </div>
    );
};

export default StudentPage;
