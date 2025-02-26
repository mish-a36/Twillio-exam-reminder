const express = require("express");
const twilio = require("twilio");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const PDFParser = require("pdf2json");
const Tesseract = require("tesseract.js");
const mammoth = require("mammoth");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Storage for uploaded files
const upload = multer({ dest: "uploads/" });

// In-memory database for events
let eventsDB = [];

// Function to extract text from PDFs
const extractTextFromPDF = (pdfPath) => {
    return new Promise((resolve, reject) => {
        let pdfParser = new PDFParser();
        pdfParser.loadPDF(pdfPath);

        pdfParser.on("pdfParser_dataError", (err) => reject("Error parsing PDF: " + err.parserError));

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            let extractedText = pdfData.Pages.map((page) =>
                page.Texts.map((t) => decodeURIComponent(t.R[0].T)).join(" ")
            ).join("\n");

            resolve(extractedText);
        });
    });
};

// Function to extract text from scanned PDFs (OCR)
const extractTextFromImage = async (imagePath) => {
    try {
        const { data } = await Tesseract.recognize(imagePath, "eng");
        return data.text;
    } catch (error) {
        throw new Error("OCR extraction failed: " + error.message);
    }
};

// Function to extract events correctly
const extractEvents = (text) => {
    const eventRegex = /(\d{2}\.\d{2}\.\d{4})\s*&\s*(FN|AN)\s+([\dA-Z]+ & [\w\s]+)/g;
    let extractedEvents = [];
    let match;

    while ((match = eventRegex.exec(text)) !== null) {
        let eventDateStr = match[1].trim();
        let session = match[2].trim();
        let subject = match[3].trim();

        extractedEvents.push(`${eventDateStr} & ${session} ${subject}`);
    }

    return extractedEvents;
};

// Send WhatsApp reminders
const sendWhatsAppReminder = async (event) => {
    try {
        const formattedNumber = event.phoneNumber.startsWith("+") ? event.phoneNumber : `+${event.phoneNumber}`;
        console.log("📞 Sending WhatsApp message to:", formattedNumber);

        await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${formattedNumber}`,
            body: `📅 Reminder: ${event.subject} on ${event.eventDate.toDateString()} (${event.session}). Be prepared!`,
        });

        console.log(`📩 Reminder sent to ${formattedNumber}`);
        event.notified = true;
    } catch (error) {
        console.error("❌ Error sending message:", error.message);
    }
};

// Upload and process timetable
app.post("/upload", upload.single("file"), async (req, res) => {
    const { path, originalname } = req.file;
    const { phoneNumber } = req.body;
    let text = "";

    console.log(`📂 Uploaded File: ${originalname}`);
    console.log(`📍 File Path: ${path}`);
    console.log(`📞 Received Phone Number:`, phoneNumber);

    try {
        if (originalname.endsWith(".pdf")) {
            try {
                text = await extractTextFromPDF(path);
            } catch (error) {
                console.log("⚠ PDF Parse Failed! Trying OCR...");
                text = await extractTextFromImage(path);
            }
        } else if (originalname.endsWith(".docx")) {
            const data = await mammoth.extractRawText({ path });
            text = data.value;
        } else {
            return res.status(400).json({ error: "Unsupported file format" });
        }

        fs.unlinkSync(path); // Delete temporary file
        console.log("📜 Extracted Text: ", text);

        const extractedEvents = extractEvents(text);
        let immediateReminders = [];

        extractedEvents.forEach(eventStr => {
            const parts = eventStr.split(" & ");
            if (parts.length < 3) return;

            const [eventDateStr, session, subject] = parts;
            let [day, month, year] = eventDateStr.split(".");
            let eventDate = new Date(`${year}-${month}-${day}T08:00:00`);

            // Add to eventsDB
            let newEvent = {
                subject: subject.trim(),
                eventDate,
                session: session.trim(),
                phoneNumber,
                notified: false,
            };
            eventsDB.push(newEvent);

            // Check if the event is for tomorrow
            let today = new Date();
            let tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            if (eventDate.toDateString() === tomorrow.toDateString()) {
                immediateReminders.push(newEvent);
            }
        });

        // Send immediate reminders for tomorrow’s events
        for (let event of immediateReminders) {
            await sendWhatsAppReminder(event);
        }

        console.log("✅ Extracted Events:", extractedEvents);
        res.json({ extractedEvents });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule reminders at 8 AM for upcoming events
cron.schedule("0 8 * * *", async () => { 
    console.log("⏰ Cron Job Running at 8 AM");

    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    for (let event of eventsDB) {
        if (!event.notified && event.eventDate.toDateString() === tomorrow.toDateString()) {
            await sendWhatsAppReminder(event);
        }
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
