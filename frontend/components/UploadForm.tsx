import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import NewInstructorPopup from './NewInstructor';
import NewCoursePopup from './NewCourse'; // Import the NewCoursePopup component

interface UploadFormProps {
    fetchStudentCourses: () => void;
    onClose: () => void; // Function to close the form
    username: string; // Add username prop
}

const UploadForm: React.FC<UploadFormProps> = ({ fetchStudentCourses, onClose, username }) => {
    const [courseName, setCourseName] = useState('');
    const [batch, setBatch] = useState('');
    const [instructor, setInstructor] = useState<string | null>(null);
    const [type, setType] = useState('');
    const [detail, setDetail] = useState('');
    const [remark, setRemark] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [facultyOptions, setFacultyOptions] = useState<any[]>([]);
    const [courseOptions, setCourseOptions] = useState<any[]>([]); // State for course options
    const [filteredFacultyOptions, setFilteredFacultyOptions] = useState<any[]>([]);
    const [filteredCourseOptions, setFilteredCourseOptions] = useState<any[]>([]); // Filtered list of course options
    const [showNewInstructorPopup, setShowNewInstructorPopup] = useState(false);
    const [showNewCoursePopup, setShowNewCoursePopup] = useState(false); // State to control the visibility of the new course popup

    useEffect(() => {
        fetchFacultyList();
        fetchCourseList(); // Fetch course list on component mount
    }, []);

    const fetchFacultyList = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/faculty');
            const facultyList = response.data.map((faculty: any) => ({ value: faculty.name, label: faculty.name }));
            facultyList.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
            setFacultyOptions([
                ...facultyList,
                { value: 'not_in_list', label: 'Not in the list - Add new' }
            ]);
            setFilteredFacultyOptions(facultyList);
        } catch (error) {
            console.error('Error fetching faculty list:', error);
        }
    };

    const fetchCourseList = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/courses');
            const courseList = response.data.map((course: any) => ({ value: course.name, label: course.name }));
            courseList.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
            setCourseOptions([
                ...courseList,
                { value: 'not_in_list', label: 'Not in the list - Add new' }
            ]);
            setFilteredCourseOptions(courseList);
        } catch (error) {
            console.error('Error fetching course list:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleNewInstructorSubmit = async (newInstructorName: string) => {
        try {
            await axios.post('http://localhost:8080/api/faculty', { name: newInstructorName });
            alert('New instructor added successfully!');
            fetchFacultyList();
            setShowNewInstructorPopup(false);
        } catch (error) {
            alert('Error adding new instructor');
            console.error(error);
        }
    };

    const handleNewCourseSubmit = async (newCourseName: string) => {
        try {
            await axios.post('http://localhost:8080/api/courses', { name: newCourseName });
            alert('New course added successfully!');
            fetchCourseList();
            setShowNewCoursePopup(false);
        } catch (error) {
            alert('Error adding new course');
            console.error(error);
        }
    };

    const handleInstructorChange = (selectedOption: any) => {
        if (selectedOption.value === 'not_in_list') {
            setShowNewInstructorPopup(true);
        } else {
            setInstructor(selectedOption.value);
        }
    };

    const handleCourseChange = (selectedOption: any) => {
        if (selectedOption.value === 'not_in_list') {
            setShowNewCoursePopup(true);
        } else {
            setCourseName(selectedOption.value);
        }
    };

    const filterFacultyOptions = (inputValue: string) => {
        const filteredOptions = facultyOptions.filter(option =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredFacultyOptions(filteredOptions);
    };

    const filterCourseOptions = (inputValue: string) => {
        const filteredOptions = courseOptions.filter(option =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredCourseOptions(filteredOptions);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        const formData = new FormData();
        formData.append('courseName', courseName);
        formData.append('batch', batch);
        formData.append('instructor', instructor || '');
        formData.append('type', type);
        formData.append('detail', detail);
        formData.append('remark', remark);
        if (file) {
            formData.append('file', file);
        }
    
        try {
            await axios.post('http://localhost:8080/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Include JWT token in headers
                    'username': username // Include username in headers
                },
            });
            alert('Upload successful!');
            fetchStudentCourses();
        } catch (error) {
            alert('Error uploading data');
            console.error(error);
        }
    };
    

    return (
        <div>
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-2xl px-8 pt-6 pb-8 mb-4 w-full max-w-2xl mx-auto relative">
                <button onClick={onClose} className="absolute top-2 right-4 mt-2 mr-2 text-gray-500 hover:text-gray-700">
                    Close
                </button>
                <h1 className="text-3xl text-blue-700 font-semibold mb-6">Upload Course Information</h1>
                <div className="space-y-4">
                    <div className="flex space-x-4">
                        <div className="w-1/2">
                            <label className="block text-gray-500 mb-2">Course Name:</label>
                            <Select
                                options={filteredCourseOptions}
                                onInputChange={filterCourseOptions}
                                value={courseName ? { value: courseName, label: courseName } : null}
                                onChange={handleCourseChange}
                                noOptionsMessage={() => (
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCoursePopup(true)}
                                        className="text-black"
                                    >
                                        Not in the list - Add new
                                    </button>
                                )}
                                styles={{
                                    option: (provided, state) => ({
                                        ...provided,
                                        backgroundColor: state.isSelected ? '#3182ce' : 'white', // Change background color when option is selected
                                        color: state.isSelected ? 'white' : 'black', // Change text color when option is selected
                                        ':hover': {
                                            backgroundColor: '#3182ce', // Change background color on hover
                                            color: 'white', // Change text color on hover
                                        },
                                    }),
                                }}
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-gray-500 mb-2">Year:</label>
                            <input
                                type="number"
                                value={batch}
                                onChange={(e) => setBatch(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500 text-black"
                                placeholder="Enter year"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-4">
                        <div className="w-1/2">
                            <label className="block text-gray-500 mb-2">Instructor:</label>
                            <Select
                                options={filteredFacultyOptions}
                                onInputChange={filterFacultyOptions}
                                value={instructor ? { value: instructor, label: instructor } : null}
                                onChange={handleInstructorChange}
                                noOptionsMessage={() => (
                                    <button
                                        type="button"
                                        onClick={() => setShowNewInstructorPopup(true)}
                                        className="text-black"
                                    >
                                        Not in the list - Add new
                                    </button>
                                )}
                                styles={{
                                    option: (provided, state) => ({
                                        ...provided,
                                        backgroundColor: state.isSelected ? '#3182ce' : 'white', // Change background color when option is selected
                                        color: state.isSelected ? 'white' : 'black', // Change text color when option is selected
                                        ':hover': {
                                            backgroundColor: '#3182ce', // Change background color on hover
                                            color: 'white', // Change text color on hover
                                        },
                                    }),
                                }}
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-gray-500 mb-2">Type:</label>
                            <Select
                                options={[
                                    { value: '', label: 'Select Type' },
                                    { value: 'Midsem', label: 'Midsem' },
                                    { value: 'Endsem', label: 'Endsem' },
                                    { value: 'Quiz', label: 'Quiz' },
                                    { value: 'Lecture Note', label: 'Lecture Note' },
                                    { value: 'Assignments', label: 'Assignments' }
                                ]}
                                value={type ? { value: type, label: type } : null}
                                onChange={(selectedOption) => {
                                    if (selectedOption) {
                                        setType(selectedOption.value);
                                    }
                                }}
                                className="w-full rounded-md focus:outline-none focus:border-blue-500 text-black"
                                styles={{
                                    control: (provided) => ({
                                        ...provided,
                                        borderColor: '#cbd5e0', // Border color
                                    }),
                                    option: (provided, state) => ({
                                        ...provided,
                                        backgroundColor: state.isSelected ? '#3182ce' : 'white',
                                        color: state.isSelected ? 'white' : 'black',
                                        ':hover': {
                                            backgroundColor: '#3182ce',
                                            color: 'white',
                                        },
                                    }),
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex space-x-4">
                        <div className="w-1/2">
                            <label className="block text-gray-500 mb-2">Remark:</label>
                            <input
                                type="text"
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500 text-black"
                                placeholder="Enter remark"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-gray-500 mb-2">File:</label>
                            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="w-full focus:outline-none" />
                        </div>
                    </div>
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white py-2 my-4 px-4 rounded-md hover:bg-blue-600 transition duration-300">Upload</button>
            </form>
            {showNewInstructorPopup && (
                <NewInstructorPopup
                    onSubmit={handleNewInstructorSubmit}
                    onClose={() => setShowNewInstructorPopup(false)}
                />
            )}
            {showNewCoursePopup && (
                <NewCoursePopup
                    onSubmit={handleNewCourseSubmit}
                    onClose={() => setShowNewCoursePopup(false)}
                />
            )}
        </div>
    );
};

export default UploadForm;
