# Cyber Risk Classifier

## Course: Network Application Development

## Project Title: Cyber Risk Classifier — AI-Powered SME Security Assessment Tool

## Author: Belinda Mandudzo
## Student ID: [YOUR STUDENT ID HERE]

## Project Description
A web application that assesses the cybersecurity risk level of small and medium enterprises (SMEs). 
Users answer six questions about their security posture. The app calculates a weighted risk score, 
assigns a risk level (Low, Medium, High), and generates a professional AI threat report using the 
Claude API with actionable recommendations.

## Tech Stack
- Python Flask (backend)
- HTML5, CSS3, JavaScript (frontend)
- Anthropic Claude API (AI threat report)

## How to Run

### Requirements
- Python 3.x
- pip

### Steps
1. Clone the repository:
   git clone https://github.com/Belinda-BTM/cyber-risk-classifier.git
   cd cyber-risk-classifier

2. Create and activate a virtual environment:
   python -m venv venv
   source venv/bin/activate

3. Install dependencies:
   pip install -r requirements.txt

4. Set your Anthropic API key:
   export ANTHROPIC_API_KEY="your-api-key-here"

5. Run the application:
   python app.py

6. Open your browser and go to:
   http://127.0.0.1:5000
