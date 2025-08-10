import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Utility function to validate doctor data
const isValidDoctor = (doctor) => {
    return doctor && 
           typeof doctor === 'object' && 
           doctor._id && 
           doctor.name && 
           doctor.speciality;
};

export const useDoctorSelection = () => {
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadDoctorFromStorage = () => {
            try {
                const stored = localStorage.getItem('selectedDoctor');
                if (stored) {
                    const parsedDoctor = JSON.parse(stored);
                    if (isValidDoctor(parsedDoctor)) {
                        setSelectedDoctor(parsedDoctor);
                        setLoading(false);
                        return;
                    } else {
                        console.error('Invalid doctor data in localStorage:', parsedDoctor);
                        localStorage.removeItem('selectedDoctor');
                    }
                }
                // If we get here, no valid doctor was found
                setLoading(false);
                navigate("/doctors");
            } catch (error) {
                console.error('Error loading doctor from storage:', error);
                localStorage.removeItem('selectedDoctor');
                setLoading(false);
                navigate("/doctors");
            }
        };

        loadDoctorFromStorage();
    }, [navigate]);

    const selectDoctor = (doctor) => {
        if (isValidDoctor(doctor)) {
            setSelectedDoctor(doctor);
            localStorage.setItem('selectedDoctor', JSON.stringify(doctor));
            return true;
        } else {
            console.error('Invalid doctor object:', doctor);
            return false;
        }
    };

    const clearDoctor = () => {
        setSelectedDoctor(null);
        localStorage.removeItem('selectedDoctor');
    };

    return {
        selectedDoctor,
        selectDoctor,
        clearDoctor,
        loading,
        isValidDoctor
    };
};
