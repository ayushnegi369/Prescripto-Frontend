import React, { useState, useContext, useEffect } from "react";
import Navbar from "../../../components/Navbar/Navbar";
import DetailCard from "../../../components/DetailCard/DetailCard";
import BookingSlot from "../../../components/BookingSlot/BookingSlot";
import RelatedDocs from "../../../components/RelatedDoctors/RelatedDocs";
import Footer from "../../../components/Footer/Footer";
import { DetailCardContext } from "../../../components/DetailCardContextFolder/DetailCardContext";
import { bookAppointment, createStripePaymentIntent } from "../../../api";
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from "react-router-dom";
import { useDoctorSelection } from "../../../hooks/useDoctorSelection";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Utility function to validate doctor data
const isValidDoctor = (doctor) => {
    return doctor && 
           typeof doctor === 'object' && 
           doctor._id && 
           doctor.name && 
           doctor.speciality;
};

function StripePaymentForm({ onSuccess, onClose, user, doctor, date, time, token }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleStripePayment = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);
        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: "if_required"
        });
        if (stripeError) {
            console.error('Stripe error:', stripeError); // Log full error
            setError(stripeError.message || 'Payment failed');
            setLoading(false);
            return;
        }
        // Payment succeeded, book appointment
        try {
            await bookAppointment({ user: user.id, doctor: doctor._id, date, time }, token);
            onSuccess && onSuccess();
        } catch (err) {
            console.error('Book appointment error:', err, err?.response);
            setError(err?.response?.data?.message || "Failed to book appointment after payment");
        }
        setLoading(false);
    };

    return (
        <div className="stripe-modal-overlay">
            <div className="stripe-modal">
                <h3>Complete Payment</h3>
                <form onSubmit={handleStripePayment}>
                    <PaymentElement />
                    <button type="submit" disabled={!stripe || loading} style={{marginTop: 16}}>
                        {loading ? "Processing..." : "Pay & Book Appointment"}
                    </button>
                    <button type="button" onClick={onClose} style={{marginLeft: 8}} disabled={loading}>
                        Cancel
                    </button>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </div>
    );
}

const Appointment = () => {
    const navigate = useNavigate();
    const { doctor, setDoctor } = useContext(DetailCardContext);
    const { selectedDoctor, loading: doctorLoading, clearDoctor } = useDoctorSelection();
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [clientSecret, setClientSecret] = useState("");
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    // Sync the selectedDoctor from hook with the context
    useEffect(() => {
        if (selectedDoctor && !doctor) {
            setDoctor(selectedDoctor);
        }
    }, [selectedDoctor, doctor, setDoctor]);

    const handleBook = async () => {
        setError("");
        setSuccess("");
        setLoading(true);
        
        // Check if user is logged in
        if (!user) {
            setError("Please log in to book an appointment");
            setLoading(false);
            return;
        }
        
        // Check if doctor is selected
        if (!doctor) {
            setError("Please select a doctor first");
            setLoading(false);
            return;
        }
        
        // Check if date and time are selected
        if (!date || !time) {
            setError("Please select both date and time");
            setLoading(false);
            return;
        }
        
        // Defensive check for doctor data
        if (!isValidDoctor(doctor)) {
            console.error('Doctor object is missing or invalid:', doctor);
            setError("Doctor information is missing. Please select a doctor again.");
            setLoading(false);
            return;
        }
        // Parse fee (e.g., "$100" -> 100)
        let amount = 100;
        if (doctor.fee) {
            const match = doctor.fee.match(/\d+/);
            if (match) amount = parseInt(match[0], 10);
        }
        try {
            // 1. Create Stripe Payment Intent
            const res = await createStripePaymentIntent(amount, "INR");
            setClientSecret(res.data.clientSecret);
            setShowPayment(true);
        } catch (err) {
            setError("Payment could not be initiated");
            setLoading(false);
        }
    };

    // Show loading state while doctor data is being loaded
    if (doctorLoading || !doctor) {
        return (
            <div>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>{doctorLoading ? 'Loading doctor information...' : 'No doctor selected'}</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <DetailCard />
            <BookingSlot setDate={setDate} setTime={setTime} onBook={handleBook} loading={loading} />
            {showPayment && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm
                        onSuccess={() => {
                            setSuccess("Appointment booked successfully!");
                            setShowPayment(false);
                            clearDoctor();
                            // Clear the doctor from context as well
                            setDoctor(null);
                        }}
                        onClose={() => setShowPayment(false)}
                        user={user}
                        doctor={doctor}
                        date={date}
                        time={time}
                        token={token}
                    />
                </Elements>
            )}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <RelatedDocs />
            <Footer />
            <style>{`
                .stripe-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .stripe-modal {
                    background: #fff;
                    padding: 32px 24px;
                    border-radius: 12px;
                    box-shadow: 0 4px 32px rgba(0,0,0,0.18);
                    min-width: 340px;
                }
            `}</style>
        </div>
    );
};

export default Appointment;
