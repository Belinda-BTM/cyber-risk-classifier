from flask import Flask, render_template, request, jsonify
import anthropic
import os
import sqlite3
from datetime import datetime

app = Flask(__name__)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def init_db():
    conn = sqlite3.connect('assessments.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            firewall TEXT,
            antivirus TEXT,
            updates TEXT,
            training TEXT,
            backups TEXT,
            passwords TEXT,
            score INTEGER,
            risk_level TEXT,
            report TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_assessment(answers, score, risk_level, report):
    conn = sqlite3.connect('assessments.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO assessments 
        (timestamp, firewall, antivirus, updates, training, backups, passwords, score, risk_level, report)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().strftime("%Y-%m-%d %H:%M"),
        answers.get('firewall'),
        answers.get('antivirus'),
        answers.get('updates'),
        answers.get('training'),
        answers.get('backups'),
        answers.get('passwords'),
        score,
        risk_level,
        report
    ))
    conn.commit()
    conn.close()

def get_all_assessments():
    conn = sqlite3.connect('assessments.db')
    c = conn.cursor()
    c.execute('SELECT id, timestamp, score, risk_level FROM assessments ORDER BY timestamp DESC')
    rows = c.fetchall()
    conn.close()
    return rows

def calculate_risk_score(answers):
    score = 0
    max_score = 100

    if answers.get('firewall') == 'no':
        score += 20
    elif answers.get('firewall') == 'partial':
        score += 10

    if answers.get('antivirus') == 'no':
        score += 15
    elif answers.get('antivirus') == 'partial':
        score += 8

    if answers.get('updates') == 'no':
        score += 20
    elif answers.get('updates') == 'sometimes':
        score += 10

    if answers.get('training') == 'no':
        score += 15
    elif answers.get('training') == 'some':
        score += 8

    if answers.get('backups') == 'no':
        score += 15
    elif answers.get('backups') == 'sometimes':
        score += 8

    if answers.get('passwords') == 'no':
        score += 15
    elif answers.get('passwords') == 'partial':
        score += 8

    if score <= 20:
        level = "Low"
    elif score <= 50:
        level = "Medium"
    else:
        level = "High"

    return {"score": score, "max_score": max_score, "level": level}

def generate_threat_report(answers, risk_level):
    prompt = f"""You are a cybersecurity expert advising a small or medium enterprise (SME).
Based on the following assessment answers, generate a professional threat report with specific recommendations.
Use plain text only. Do not use markdown, hashtags, emojis, bullet points, tables, or any special formatting.
Write in clear professional paragraphs only. Keep it to 4-5 sentences.

Assessment Results:
- Firewall: {answers.get('firewall')}
- Antivirus: {answers.get('antivirus')}
- Software Updates: {answers.get('updates')}
- Employee Training: {answers.get('training')}
- Data Backups: {answers.get('backups')}
- Password Policy: {answers.get('passwords')}
- Overall Risk Level: {risk_level}

Provide specific, actionable recommendations based on the weak areas identified."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/history')
def history():
    assessments = get_all_assessments()
    return render_template('history.html', assessments=assessments)

@app.route('/assess', methods=['POST'])
def assess():
    answers = request.json
    result = calculate_risk_score(answers)
    report = generate_threat_report(answers, result['level'])
    result['report'] = report
    save_assessment(answers, result['score'], result['level'], report)
    return jsonify(result)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
