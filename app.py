from flask import Flask, render_template, request, jsonify
import anthropic
import os

app = Flask(__name__)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Risk scoring engine
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


@app.route('/assess', methods=['POST'])
def assess():
    answers = request.json
    result = calculate_risk_score(answers)
    report = generate_threat_report(answers, result['level'])
    result['report'] = report
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)
