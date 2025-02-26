import React, { useState } from "react";
import axios from "axios";

function App() {
    const [file, setFile] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const uploadFile = async () => {
        if (!file) return setError("❌ Please select a file.");
        if (!phoneNumber.startsWith("+")) return setError("❌ Enter a valid phone number with country code (e.g., +919876543210).");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("phoneNumber", phoneNumber);

        setLoading(true);
        setError("");

        try {
            const response = await axios.post("http://localhost:5000/upload", formData);
            setEvents(response.data.extractedEvents || []);
        } catch (error) {
            setError("⚠ Error uploading file: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2>📅 Upload Timetable</h2>

            <input 
                type="text" 
                placeholder="📞 Enter phone number with country code (e.g., +91XXXXXXXXXX)" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                style={styles.input}
            />

            <input type="file" onChange={(e) => setFile(e.target.files[0])} style={styles.fileInput} />

            <button onClick={uploadFile} disabled={loading} style={styles.button}>
                {loading ? "Uploading..." : "📤 Upload"}
            </button>

            {error && <p style={styles.error}>{error}</p>}

            <h3>📌 Extracted Events</h3>
            <ul style={styles.list}>
                {events.length > 0 ? (
                    events.map((event, index) => <li key={index}>{event}</li>)
                ) : (
                    <p>No events extracted yet.</p>
                )}
            </ul>
        </div>
    );
}

const styles = {
    container: { textAlign: "center", marginTop: "50px" },
    input: { width: "300px", padding: "10px", margin: "10px", fontSize: "16px" },
    fileInput: { margin: "10px", fontSize: "16px" },
    button: { padding: "10px 20px", fontSize: "16px", cursor: "pointer", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px" },
    error: { color: "red", fontWeight: "bold" },
    list: { textAlign: "left", display: "inline-block" },
};

export default App;