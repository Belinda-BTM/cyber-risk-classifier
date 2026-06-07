async function submitAssessment() {
    const answers = {
        firewall: document.getElementById('firewall').value,
        antivirus: document.getElementById('antivirus').value,
        updates: document.getElementById('updates').value,
        training: document.getElementById('training').value,
        backups: document.getElementById('backups').value,
        passwords: document.getElementById('passwords').value
    };

    const resultDiv = document.getElementById('result');
    resultDiv.classList.remove('hidden', 'low', 'medium', 'high');
    resultDiv.innerHTML = '<p>Generating your threat report...</p>';

    const response = await fetch('/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
    });

    const result = await response.json();

    resultDiv.classList.add(result.level.toLowerCase());

    resultDiv.innerHTML = `
        <h2>Risk Level: ${result.level}</h2>
        <p>Score: ${result.score} / ${result.max_score}</p>
        <p>${getRiskMessage(result.level)}</p>
        <hr style="border-color: currentColor; margin: 15px 0;">
        <h3>AI Threat Report</h3>
        <p style="text-align: left; line-height: 1.6;">${result.report}</p>
    `;
}

function getRiskMessage(level) {
    if (level === 'Low') return 'Your organisation has good cyber hygiene. Keep it up!';
    if (level === 'Medium') return 'Some vulnerabilities detected. Review your security policies.';
    if (level === 'High') return 'High risk detected! Immediate action recommended.';
}
