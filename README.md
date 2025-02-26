# Twillio-exam-reminder
# Timetable Event Reminder System

## Overview

This project is a timetable event reminder system that allows users to upload timetables (PDF, DOCX, Scanned PDFs) and automatically extracts event details, stores them, and sends WhatsApp reminders via Twilio for upcoming events.

## Technical Mechanism

The system follows these key processes:

### File Upload & Extraction

- Users upload timetable files (PDF, DOCX, or scanned PDFs).
- The system extracts text:
  - PDF: Uses `pdf2json`.
  - Scanned PDFs: Uses `Tesseract.js` (OCR for image-to-text conversion).
  - DOCX: Uses `mammoth` for extracting raw text.
- Extracted data is parsed using regular expressions to identify event dates, sessions, and subjects.

### Storing Events

- Extracted events are stored in an in-memory database (`eventsDB`) in the following format:
  ```json
  {
    "subject": "Mathematics",
    "eventDate": "2025-03-01T08:00:00",
    "session": "FN",
    "phoneNumber": "+1234567890",
    "notified": false
  }
  ```

### Immediate Notifications for Tomorrow’s Events

- If an uploaded timetable contains events scheduled for tomorrow, the system sends an immediate WhatsApp reminder.
- Uses Twilio's API to send messages.

### Scheduled Daily Reminders

- A cron job runs daily at 8 AM to check upcoming events and sends reminders if they were not already sent.
- Ensures that no past events trigger notifications.

## Project Setup & Execution

### Clone the Repository

```bash
git clone https://github.com/your-username/timetable-reminder.git
cd timetable-reminder
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment Variables

Create a `.env` file in the root directory and add:

```env
PORT=5000
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Twilio sandbox number
```

### Start the Server

```bash
node server.js
```

### Test the API

Use Postman or cURL to test file uploads.

#### Upload a Timetable

```bash
curl -X POST http://localhost:5000/upload \ -H "Content-Type: multipart/form-data" \ -F "file=@timetable.pdf" \ -F "phoneNumber=+1234567890"
```

#### Trigger Immediate Reminders Manually

```bash
curl -X GET http://localhost:5000/send-immediate-reminder
```

## Features & Functionalities

- Supports PDFs, DOCX, and Scanned PDFs
- Extracts events automatically
- Immediate reminders for tomorrow’s events
- Scheduled reminders at 8 AM
- Twilio WhatsApp Integration
- Cron job for scheduled notifications

## Twilio API Configuration

- Sign up on Twilio.
- Get a WhatsApp sandbox number.
- Verify your phone number.

## Dependencies Used

- Express.js (Backend Server)
- Multer (File Uploads)
- pdf2json (PDF Text Extraction)
- Tesseract.js (OCR for Scanned PDFs)
- Mammoth (DOCX Text Extraction)
- Twilio (WhatsApp Messaging API)
- node-cron (Scheduled Reminders)

## Future Enhancements

- Database Integration (MongoDB or MySQL instead of in-memory storage)
- User Authentication (Allow login/signup)
- Web Interface (UI for file uploads and event tracking)



