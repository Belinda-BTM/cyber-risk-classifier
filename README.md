# Cyber Risk Classifier

## Course: Engineering Project
## Project Title: Cyber Risk Classifier — AI-Powered SME Security Assessment Tool
## Author: Belinda Tanatswa Mandudzo
## Student ID: 64290

---

## Project Description

A web application that assesses the cybersecurity risk level of small 
and medium enterprises (SMEs). Users answer six questions about their 
security posture. The app calculates a weighted risk score, assigns a 
risk level (Low, Medium, High), and generates a professional AI threat 
report using the Claude API with actionable recommendations. All 
assessments are saved to a SQLite database so organisations can track 
their security progress over time.

---

## Tech Stack

- Python Flask (backend)
- HTML5, CSS3, JavaScript (frontend)
- SQLite (assessment history database)
- Anthropic Claude API (AI threat report generation)

---

## Project Structure
/cyber-risk-classifier
│
├── app.py                  # Flask backend, scoring engine, database
├── requirements.txt        # Python dependencies
├── .env.example            # API key setup instructions
├── assessments.db          # SQLite database (auto-created on first run)
│
├── templates/
│   ├── index.html          # Main assessment form
│   └── history.html        # Assessment history page
│
├── static/
│   ├── style.css           # Dark cybersecurity theme
│   └── app.js              # Frontend logic
│
└── Documentation/
└── project-report.md   # Full project report
---

## How to Run

### Requirements
- Python 3.x
- pip

### Steps

1. Clone the repository:git clone https://github.com/Belinda-BTM/cyber-risk-classifier.git
cd cyber-risk-classifier
2. Create and activate a virtual environment:
python -m venv venv
source venv/bin/activate
3. Install dependencies:pip install -r requirements.txt
4. Set your Anthropic API key (optional — app works without it):export ANTHROPIC_API_KEY="your-api-key-here"
Get a free API key from https://console.anthropic.com

5. Run the application:
python app.py
6. Open your browser at:http://127.0.0.1:5000

---

## Features

- Six-question cybersecurity risk assessment
- Weighted scoring engine (Low / Medium / High risk levels)
- AI-generated professional threat report (requires API key)
- SQLite database storing all past assessments
- Assessment history page to track progress over time
- Graceful fallback if no API key is provided
