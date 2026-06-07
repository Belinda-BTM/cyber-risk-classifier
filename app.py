from flask import Flask, render_template, request, jsonify
import anthropic

app = Flask(__name__)

# Risk scoring engine
def calculate_risk_score(answers):
    score = 0
    max_score = 100

    # Firewall
    if answers.get('firewall') == 'no':
        score += 20
    elif answers.get('firewall') == 'partial':
        score += 10

    # Antivirus
    if answers.get('antivirus') == 'no':
        score += 15
    elif answers.get('antivirus') == 'partial':
        score += 8

    # Software updates
    if answers.get('updates') == 'no':
        score += 20
    elif answers.get('updates') == 'sometimes':
        score += 10

    # Employee training
    if answers.get('training') == 'no':
        score += 15
    elif answers.get('training') == 'some':
        score += 8

    # Backups
    if answers.get('backups') == 'no':
        score += 15
    elif answers.get('backups') == 'sometimes':
        score += 8

    # Password policy
    if answers.get('passwords') == 'no':
        score += 15
    elif answers.get('passwords') == 'partial':
        score += 8

    # Determine risk level
    if score <= 20:
        level = "Low"
    elif score <= 50:
        level = "Medium"
    else:
        level = "High"

    return {"score": score, "max_score": max_score, "level": level}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/assess', methods=['POST'])
def assess():
    answers = request.json
    result = calculate_risk_score(answers)
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)
