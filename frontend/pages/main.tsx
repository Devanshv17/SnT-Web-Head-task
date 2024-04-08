import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadForm from '../components/UploadForm';
import ProfileSection from '../components/ProfileSection';
import { useRouter } from 'next/router';

interface UploadedFile {
    _id: string;
    courseName: string;
    batch: string;
    instructor: string;
    type: string;
    remark: string;
    link: string;
}

const MainPage: React.FC = () => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([]); // Added state for filtered files
    const [username, setUsername] = useState<string>(''); // Added state for username
    const filesPerPage = 12;
    const router = useRouter();

    useEffect(() => {
        fetchUploadedFiles(); // Fetch files when the component mounts
        setUsername(getUsernameFromToken()); // Set the username when the component mounts
    }, []);

    const fetchUploadedFiles = async () => {
        try {
            const response = await axios.get<UploadedFile[]>('http://localhost:8080/api/fetch');
            if (response.status === 200) {
                setUploadedFiles(response.data || []);
                setFilteredFiles(response.data || []); // Initialize filteredFiles state with all files
            } else {
                console.error('Error fetching uploaded files:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching uploaded files:', error);
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

    const handleLogout = () => {
        // Clear token from localStorage
        localStorage.removeItem('token');
        // Redirect to login page
        router.push('/login');
    };

    const handleToggleForm = () => {
        setShowUploadForm(!showUploadForm);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setFilteredFiles(filterFiles(query, uploadedFiles));
    };

    const filterFiles = (query: string, files: UploadedFile[]) => {
        return files.filter(file =>
            file.courseName.toLowerCase().includes(query.toLowerCase()) ||
            file.type.toLowerCase().includes(query.toLowerCase()) ||
            file.instructor.toLowerCase().includes(query.toLowerCase()) ||
            file.batch.toLowerCase().includes(query.toLowerCase()) ||
            file.remark.toLowerCase().includes(query.toLowerCase())
        );
    };

    // Add a function to check if the user is authenticated
    const isLoggedIn = () => {
        const token = localStorage.getItem('token');
        return !!token; // Returns true if token is present, false otherwise
    };

    // If the user is not logged in, redirect to the login page
    useEffect(() => {
        if (!isLoggedIn()) {
            router.push('/login');
        }
    }, []);

    const indexOfLastFile = Math.min(currentPage * filesPerPage, filteredFiles.length);
    const indexOfFirstFile = Math.min(indexOfLastFile - filesPerPage, filteredFiles.length);

    const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);

    const maxPages = Math.ceil(filteredFiles.length / filesPerPage);

    // Pagination handlers
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Main page UI

    return (
        <div className="container mx-auto mt-8 relative">
            <div className="flex justify-between items-center">
            <h1 className="text-6xl py-4 font-bold text-center mb-4 flex-grow">EduWise</h1>
            <div>
                <ProfileSection username={username} handleLogout={handleLogout} />
            </div>
            </div>

            <div className="mb-8 text-right">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="border my-4 text-black border-gray-300 rounded-full px-4 py-2 mx-auto block max-w-3xl w-full"
                />

                <button onClick={handleToggleForm} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
                    {showUploadForm ? 'Close Form' : 'Upload Files'}
                </button>
            </div>

            {showUploadForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 bg-white p-8 rounded-2xl shadow-lg">
                    
                    <UploadForm username={username} fetchUploadedFiles={fetchUploadedFiles} onClose={() => setShowUploadForm(false)} />
                </div>
            )}

            <div className="grid gap-16 mt-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {currentFiles.map((file, index) => (
                    <a href={file.link} download key={index}>
                        <div className="text-center mt-2 bg-gray-100 py-10 px-8 rounded-md shadow-md h-40 max-w-xs sm:max-w-full">
                            <h2 className="text-base text-gray-700 font-semibold">{file.courseName}</h2>
                            <p className="text-gray-500 text-xs">{file.type}</p>
                            <p className="text-gray-500 text-xs">Instructor: {file.instructor}, Batch: {file.batch}</p>
                            <p className="text-gray-500 text-xs">Remark: {file.remark}</p>
                        </div>
                    </a>
                ))}
            </div>

            {/* Pagination */}
            {filteredFiles.length > filesPerPage && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 mx-1 rounded"
                    >
                        {"<<"}
                    </button>
                    {Array.from({ length: Math.min(maxPages, 10) }, (_, i) => {
                        const pageNumber = currentPage + i - 5;
                        return (
                            pageNumber > 0 && pageNumber <= maxPages && (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`bg-gray-200 text-gray-800 font-semibold py-2 px-4 mx-1 rounded ${
                                        currentPage === pageNumber ? 'bg-gray-400' : ''
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            )
                        );
                    })}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === maxPages}
                        className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 mx-1 rounded"
                    >
                        {">>"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MainPage;
