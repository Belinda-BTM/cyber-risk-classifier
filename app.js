document.addEventListener('DOMContentLoaded', () => {
  generateParticles();
  initSliders();
  initChips();
});

function generateParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.width = p.style.height = (1 + Math.random() * 2) + 'px';
    container.appendChild(p);
  }
}

function initSliders() {
  document.getElementById('q-emp').addEventListener('input', function () {
    document.getElementById('emp-display').textContent = this.value;
  });
  document.getElementById('q-assets').addEventListener('input', function () {
    document.getElementById('assets-display').textContent = this.value;
  });
}

function initChips() {
  document.querySelectorAll('.chip-grid').forEach(grid => {
    const mode = grid.dataset.mode;
    grid.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (mode === 'single') {
          grid.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
        } else {
          chip.classList.toggle('selected');
        }
      });
    });
  });
}

function goStep(n) {
  [1, 2, 3, 4].forEach(i => {
    const panel = document.getElementById(`step${i}`);
    const ps = document.getElementById(`ps${i}`);
    panel.classList.toggle('hidden', i !== n);
    ps.classList.remove('active', 'done');
    if (i === n) ps.classList.add('active');
    if (i < n) {
      ps.classList.add('done');
      ps.querySelector('.ps-num').textContent = '✓';
    } else {
      ps.querySelector('.ps-num').textContent = i;
    }
    if (i < 4) {
      const pl = document.getElementById(`pl${i}`);
      if (pl) pl.classList.toggle('done', i < n);
    }
  });
  window.scrollTo({ top: document.getElementById('assessment').offsetTop - 80, behavior: 'smooth' });
}

function readSingle(id) {
  const sel = document.querySelector(`#${id} .chip.selected`);
  return sel ? Number(sel.dataset.v) : null;
}

function readMulti(id) {
  return [...document.querySelectorAll(`#${id} .chip.selected`)].map(c => Number(c.dataset.v));
}

function readSingleText(id) {
  const sel = document.querySelector(`#${id} .chip.selected`);
  return sel ? sel.textContent.trim() : 'Not specified';
}

function readMultiText(id) {
  return [...document.querySelectorAll(`#${id} .chip.selected`)].map(c => c.textContent.trim());
}

function runAnalysis() {
  const industry = readSingle('q-industry');
  const empCount = parseInt(document.getElementById('q-emp').value);
  const revenue = readSingle('q-revenue');
  const dataTypes = readMulti('q-data');
  const cloud = readMulti('q-cloud');
  const assets = parseInt(document.getElementById('q-assets').value);
  const remote = readSingle('q-remote');
  const vendors = readSingle('q-vendors');
  const controls = readMulti('q-controls');
  const scanHistory = readSingle('q-scan');
  const compliance = readMulti('q-compliance');
  const incidents = readSingle('q-incidents');
  const staff = readSingle('q-staff');

  const answered = [industry, revenue, remote, vendors, scanHistory, incidents, staff]
    .filter(v => v !== null).length;
  const confidence = Math.round((answered / 7) * 100);

  const dimExposure = calcDim([
    (industry || 1) * 12,
    Math.min(assets * 3, 30),
    (remote || 1) * 10,
    (vendors || 0) * 8
  ], 100);

  const dimData = calcDim([
    dataTypes.reduce((a, b) => a + b, 0) * 6,
    compliance.reduce((a, b) => a + b, 0) * 4
  ], 100);

  const dimInfra = calcDim([
    cloud.reduce((a, b) => a + b, 0) * 5,
    Math.min(empCount / 5, 20),
    (revenue || 1) * 6
  ], 100);

  const controlPenalty = controls.reduce((a, b) => a + Math.abs(b), 0) * 3;
  const dimPosture = Math.max(0, Math.min(100,
    (scanHistory || 2) * 18 + (staff || 2) * 12 - controlPenalty + 20
  ));

  const dimHistory = Math.min(100, (incidents || 0) * 22 + (scanHistory || 2) * 8);

  const score = Math.round(
    dimExposure * 0.25 +
    dimData * 0.20 +
    dimInfra * 0.20 +
    dimPosture * 0.20 +
    dimHistory * 0.15
  );

  const clampedScore = Math.min(99, Math.max(1, score));

  let tier, tierLabel, tierDesc;
  if (clampedScore >= 75) {
    tier = 'critical'; tierLabel = 'CRITICAL RISK';
    tierDesc = 'Your organisation presents a highly attractive attack surface. Immediate remediation is strongly advised.';
  } else if (clampedScore >= 55) {
    tier = 'high'; tierLabel = 'HIGH RISK';
    tierDesc = 'Significant vulnerabilities detected. Your current posture leaves you exposed to targeted attacks.';
  } else if (clampedScore >= 35) {
    tier = 'medium'; tierLabel = 'MEDIUM RISK';
    tierDesc = 'Moderate risk exposure with identifiable gaps. Proactive measures will substantially reduce your attack surface.';
  } else {
    tier = 'low'; tierLabel = 'LOW RISK';
    tierDesc = 'Relatively strong security posture detected. Continue to maintain and improve existing controls.';
  }

  let roiClass, roiIcon, roiLabel, roiRationale;
  const forceRecommend = (scanHistory >= 2) || (incidents >= 2) || (assets > 15);
  if (clampedScore >= 55 || forceRecommend) {
    roiClass = 'recommended'; roiIcon = '▲'; roiLabel = 'RECOMMENDED';
    roiRationale = 'Your risk profile strongly justifies the investment. A vulnerability scanner would identify exploitable weaknesses before attackers do, providing clear ROI through breach prevention.';
  } else if (clampedScore >= 35) {
    roiClass = 'consider'; roiIcon = '◆'; roiLabel = 'CONSIDER IT';
    roiRationale = 'A scanner would provide value, particularly given your internet-facing assets and data handling. Weigh the cost against your current exposure level.';
  } else {
    roiClass = 'lower'; roiIcon = '▼'; roiLabel = 'LOWER PRIORITY';
    roiRationale = 'Your current controls appear adequate for your risk level. Focus on maintaining existing measures before investing in additional tooling.';
  }

  const findings = buildFindings({ scanHistory, incidents, controls, assets, dataTypes, staff, compliance });

  const inputSummary = buildInputSummary({
    industry: readSingleText('q-industry'),
    employees: empCount,
    revenue: readSingleText('q-revenue'),
    dataTypes: readMultiText('q-data'),
    cloud: readMultiText('q-cloud'),
    assets,
    remote: readSingleText('q-remote'),
    vendors: readSingleText('q-vendors'),
    controls: readMultiText('q-controls'),
    scanHistory: readSingleText('q-scan'),
    compliance: readMultiText('q-compliance'),
    incidents: readSingleText('q-incidents'),
    staff: readSingleText('q-staff')
  });

  const dims = [
    { label: 'Exposure Surface', value: dimExposure },
    { label: 'Data Sensitivity', value: dimData },
    { label: 'Infrastructure', value: dimInfra },
    { label: 'Security Posture', value: dimPosture },
    { label: 'Incident History', value: dimHistory }
  ];

  renderResults({
    score: clampedScore, tier, tierLabel, tierDesc,
    confidence, dims, roiClass, roiIcon, roiLabel, roiRationale,
    findings, inputSummary
  });

  goStep(4);
}

function calcDim(values, max) {
  const raw = values.reduce((a, b) => a + b, 0);
  return Math.min(100, Math.round((raw / max) * 100));
}

function buildFindings({ scanHistory, incidents, controls, assets, dataTypes, staff, compliance }) {
  const f = [];
  if (scanHistory >= 2) f.push({ type: 'danger', text: 'Vulnerability scanning is overdue or has never been performed' });
  if (incidents >= 2) f.push({ type: 'danger', text: 'Previous security incidents increase re-attack probability' });
  if (assets > 15) f.push({ type: 'warning', text: 'High number of internet-facing assets expands attack surface' });
  if (dataTypes.some(v => v === 3)) f.push({ type: 'warning', text: 'Highly sensitive data types handled (PII, financial, health)' });
  if (staff >= 2) f.push({ type: 'warning', text: 'Limited dedicated security expertise increases response risk' });
  if (compliance.some(v => v >= 2)) f.push({ type: 'warning', text: 'Regulatory compliance requirements add breach consequence severity' });
  if (controls.some(v => v <= -2)) f.push({ type: 'good', text: 'Core security controls detected — effective if properly maintained' });
  return f;
}

function buildInputSummary(inputs) {
  return `
Industry: ${inputs.industry}
Employees: ${inputs.employees}
Revenue: ${inputs.revenue}
Data types: ${inputs.dataTypes.join(', ') || 'None selected'}
Cloud services: ${inputs.cloud.join(', ') || 'None'}
Internet-facing assets: ${inputs.assets}
Remote work: ${inputs.remote}
Vendors/integrations: ${inputs.vendors}
Security controls: ${inputs.controls.join(', ') || 'None selected'}
Last scan: ${inputs.scanHistory}
Compliance: ${inputs.compliance.join(', ') || 'None'}
Incidents: ${inputs.incidents}
IT/security staff: ${inputs.staff}
  `.trim();
}

function renderResults({ score, tier, tierLabel, tierDesc, confidence, dims, roiClass, roiIcon, roiLabel, roiRationale, findings, inputSummary }) {
  const dimBarsHTML = dims.map(d => `
    <div class="dim-bar">
      <div class="dim-bar-header">
        <span class="dim-bar-label">${d.label}</span>
        <span class="dim-bar-val">${d.value}</span>
      </div>
      <div class="dim-bar-track">
        <div class="dim-bar-fill ${d.value >= 60 ? 'high-risk' : ''}" style="width: ${d.value}%"></div>
      </div>
    </div>
  `).join('');

  const findingsHTML = findings.map(f => `
    <div class="finding-item">
      <div class="finding-dot ${f.type}"></div>
      <span>${f.text}</span>
    </div>
  `).join('');

  const metricsHTML = `
    <div class="metrics-row">
      <div class="metric-box">
        <div class="metric-label">RISK TIER</div>
        <div class="metric-val" style="color:${tier === 'critical' ? 'var(--accent-red)' : tier === 'high' ? '#ff6b35' : tier === 'medium' ? 'var(--accent-yellow)' : 'var(--accent-green)'}">${tierLabel}</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">TOP DIMENSION</div>
        <div class="metric-val">${dims.reduce((a, b) => a.value > b.value ? a : b).label}</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">SCANNER ROI</div>
        <div class="metric-val">${roiLabel}</div>
      </div>
    </div>
  `;

  document.getElementById('results-container').innerHTML = `
    <div class="results-header">
      <div class="section-label">// ANALYSIS COMPLETE</div>
      <h3>Threat Surface Assessment Results</h3>
      <p>Based on ${confidence}% of recommended inputs — add more detail to increase confidence.</p>
    </div>

    <div class="risk-banner ${tier}">
      <div class="risk-score-block">
        <div class="risk-score-num ${tier}">${score}</div>
        <div class="risk-score-sub">/ 100 risk index</div>
      </div>
      <div class="risk-info-block">
        <div class="risk-tier-badge ${tier}">${tierLabel}</div>
        <p class="risk-desc-text">${tierDesc}</p>
      </div>
      <div class="risk-conf">
        <span class="risk-conf-val">${confidence}%</span>
        <span class="risk-conf-label">INPUT CONFIDENCE</span>
      </div>
    </div>

    ${metricsHTML}

    <div class="results-grid">
      <div class="result-card">
        <div class="result-card-title">// RISK DIMENSION BREAKDOWN</div>
        ${dimBarsHTML}
      </div>
      <div class="result-card">
        <div class="result-card-title">// THREAT RADAR</div>
        <div class="chart-wrap">
          <canvas id="radar-chart"></canvas>
        </div>
      </div>
    </div>

    <div class="roi-card">
      <div class="roi-header">
        <span class="roi-icon">◈</span>
        <h4>VULNERABILITY SCANNER ROI VERDICT</h4>
      </div>
      <div class="roi-body">
        <div class="roi-verdict ${roiClass}">
          <span class="roi-verdict-icon">${roiIcon}</span>
          <span class="roi-verdict-label">${roiLabel}</span>
        </div>
        <div>
          <p class="roi-rationale">${roiRationale}</p>
          <div class="findings-list">${findingsHTML}</div>
        </div>
      </div>
    </div>

    <div class="ai-card">
      <div class="ai-header">
        <div class="ai-header-left">
          <span class="ai-badge">AI</span>
          <h4>CLAUDE AI — THREAT INTELLIGENCE REPORT</h4>
        </div>
      </div>
      <div class="ai-body">
        <div class="ai-api-form">
          <input type="password" class="api-key-input" id="api-key-input" placeholder="Enter your Anthropic API key to unlock AI analysis..." />
          <button class="btn-ai" id="btn-generate-ai" onclick="generateAIAnalysis('${encodeURIComponent(inputSummary)}', ${score}, '${tier}', '${roiLabel}')">ANALYSE</button>
        </div>
        <div class="ai-output" id="ai-output">
          <span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-dim);">// Enter your API key above to generate a personalised AI threat intelligence report</span>
        </div>
      </div>
    </div>

    <button class="restart-btn" onclick="restartAssessment()">◀ RUN NEW ASSESSMENT</button>
  `;

  setTimeout(() => renderRadar(dims), 100);
}

function renderRadar(dims) {
  const canvas = document.getElementById('radar-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: dims.map(d => d.label),
      datasets: [{
        label: 'Risk Score',
        data: dims.map(d => d.value),
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        borderColor: 'rgba(0, 229, 255, 0.8)',
        borderWidth: 1.5,
        pointBackgroundColor: '#00e5ff',
        pointBorderColor: '#00e5ff',
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            display: false,
            stepSize: 25
          },
          grid: {
            color: 'rgba(0, 229, 255, 0.1)',
            lineWidth: 1
          },
          angleLines: {
            color: 'rgba(0, 229, 255, 0.1)'
          },
          pointLabels: {
            font: { family: 'Share Tech Mono', size: 10 },
            color: 'rgba(122, 172, 204, 0.9)'
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

async function generateAIAnalysis(encodedSummary, score, tier, roiLabel) {
  const apiKey = document.getElementById('api-key-input').value.trim();
  if (!apiKey) {
    document.getElementById('ai-output').innerHTML = '<span style="color: var(--accent-red); font-family: var(--font-mono); font-size: 12px;">// ERROR: API key required</span>';
    return;
  }

  const inputSummary = decodeURIComponent(encodedSummary);
  const btn = document.getElementById('btn-generate-ai');
  btn.disabled = true;

  document.getElementById('ai-output').innerHTML = `
    <div class="ai-thinking">
      <span>ANALYSING THREAT VECTORS</span>
      <div class="thinking-dots">
        <span>.</span><span>.</span><span>.</span>
      </div>
    </div>
  `;

  const prompt = `You are a senior cybersecurity analyst. A small-to-medium business has completed a cyber risk assessment.

Assessment inputs:
${inputSummary}

Risk score: ${score}/100 (${tier} risk)
Scanner ROI verdict: ${roiLabel}

Write a professional threat intelligence report in 3 paragraphs:
1. Overview of the organisation's threat profile and key risk drivers
2. The top 3 specific vulnerabilities or exposures identified from their inputs, with brief explanation of each
3. Prioritised recommendations and a clear justification for the vulnerability scanner investment verdict

Be specific, technical, and direct. Reference actual details from their inputs. Do not use bullet points — write in flowing paragraphs.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      document.getElementById('ai-output').innerHTML = `<span style="color: var(--accent-red); font-family: var(--font-mono); font-size: 12px;">// ERROR: ${data.error.message}</span>`;
    } else {
      const text = data.content[0].text;
      const formatted = text.split('\n\n').map(p => `<p style="margin-bottom: 14px;">${p}</p>`).join('');
      document.getElementById('ai-output').innerHTML = formatted;
    }
  } catch (err) {
    document.getElementById('ai-output').innerHTML = `<span style="color: var(--accent-red); font-family: var(--font-mono); font-size: 12px;">// ERROR: ${err.message}</span>`;
  }

  btn.disabled = false;
}

function restartAssessment() {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  document.getElementById('q-emp').value = 25;
  document.getElementById('emp-display').textContent = 25;
  document.getElementById('q-assets').value = 5;
  document.getElementById('assets-display').textContent = 5;
  document.getElementById('results-container').innerHTML = '';
  goStep(1);
}
