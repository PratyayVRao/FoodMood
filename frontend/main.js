// your unchanged variables ...
const organBaseIds = [
  'Lungs', 'Heart', 'Stomach', 'Thyroid', 'Thymus', 'Liver',
  'Pancreas', 'Spleen', 'SmallIntestine', 'LargeIntestine',
  'UrinarySystem', 'MaleReproductiveSystem', 'FemaleReproductiveSystem',
  'Brain', 'Intestines'
];

const organVariants = {
  'Lungs': ['Lungs', 'LungsM', 'LungsF'],
  'Heart': ['Heart', 'HeartM', 'HeartF'],
  'Stomach': ['Stomach', 'StomachM', 'StomachF'],
  'Thyroid': ['Thyroid', 'ThyroidM', 'ThyroidF'],
  'Thymus': ['ThymusGland', 'ThymusM', 'ThymusF'],
  'Liver': ['Liver', 'LiverM', 'LiverF'],
  'Pancreas': ['Pancreas', 'PancreasM', 'PancreasF'],
  'Spleen': ['Spleen', 'SpleenM', 'SpleenF'],
  'SmallIntestine': ['SIF', 'SIM'],
  'LargeIntestine': ['LIF', 'LIM'],
  'Intestines': ['Intestines'],
  'UrinarySystem': ['UrinarySystem', 'UrinaryM', 'UrinaryF'],
  'MaleReproductiveSystem': ['MRS', 'MaleReproductiveSystem'],
  'FemaleReproductiveSystem': ['FRS', 'FemaleReproductiveSystem'],
  'Brain': ['Brain', 'BrainM', 'BrainF'],
};

const originalColors = {};
let selectedOrgan = null;
let organScores = {};

document.addEventListener('DOMContentLoaded', () => {
  Object.values(organVariants).flat().forEach(organId => {
    const group = document.querySelector(`#${organId}`);
    if (group) {
      originalColors[organId] = [];
      group.querySelectorAll('path').forEach(path => {
        originalColors[organId].push(path.getAttribute('fill'));
      });
    }
  });

  addOrganInteraction();

  // Add the loading indicator element to the DOM (if not already in your HTML)
  if (!document.getElementById('loading-indicator')) {
    const loadingEl = document.createElement('div');
    loadingEl.id = 'loading-indicator';
    loadingEl.style.cssText = 'display:none; color:#006c67; font-weight:bold; margin-top:10px;';
    loadingEl.textContent = 'Analyzing... Please wait.';
    const form = document.querySelector('#food-form');
    form.parentNode.insertBefore(loadingEl, form.nextSibling);
  }

  const form = document.querySelector('#food-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const loadingEl = document.getElementById('loading-indicator');
    loadingEl.style.display = 'block'; // Show loading

    const food = document.querySelector('#food-input').value.trim();
    const condition = document.getElementById('condition-select').value;
    if (!food) {
      alert('Please enter a food!');
      loadingEl.style.display = 'none'; // Hide loading
      return;
    }

    resetOrganColors();
    clearOrganSelection();

    try {
      const res = await fetch('https://foodmood-backend1.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food, condition }),
      });

      if (!res.ok) throw new Error('Failed to get organ scores');
      organScores = await res.json();

      Object.entries(organScores).forEach(([baseId, score]) => {
        const color = getColorFromScore(score);
        const variants = organVariants[baseId] || [];
        variants.forEach(id => setOrganColor(id, color));
      });

    } catch (error) {
      alert('Error fetching organ scores: ' + error.message);
    } finally {
      loadingEl.style.display = 'none'; // Always hide loading when done
    }
  });

  const resetBtn = document.querySelector('#reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetOrganColors);

  document.getElementById('modal-close').addEventListener('click', hideModal);
  window.addEventListener('click', e => {
    const modal = document.getElementById('organ-modal');
    if (e.target === modal) {
      hideModal();
    }
  });
});

function getColorFromScore(score) {
  if (score <= 50) {
    const ratio = score / 50;
    const r = Math.round(20 + ratio * (210 - 20));
    const g = Math.round(80 + ratio * (210 - 80));
    const b = Math.round(20 + ratio * (80 - 20));
    return `rgb(${r},${g},${b})`;
  } else {
    const ratio = (score - 50) / 50;
    const r = Math.round(210 - ratio * (210 - 120));
    const g = Math.round(210 - ratio * (210 - 30));
    const b = Math.round(80 - ratio * (80 - 40));
    return `rgb(${r},${g},${b})`;
  }
}

function setOrganColor(organId, color) {
  const group = document.querySelector(`#${organId}`);
  if (group) {
    group.querySelectorAll('path').forEach(path => {
      path.style.setProperty('fill', color, 'important');
    });
  }
}

function resetOrganColors() {
  Object.entries(originalColors).forEach(([organId, fills]) => {
    const group = document.querySelector(`#${organId}`);
    if (group) {
      const paths = group.querySelectorAll('path');
      paths.forEach((path, i) => {
        path.style.removeProperty('fill');
        if (fills[i]) path.setAttribute('fill', fills[i]);
      });
    }
  });

  clearOrganSelection();
}

function addOrganInteraction() {
  const allOrganIds = Object.values(organVariants).flat();

  allOrganIds.forEach(organId => {
    const group = document.querySelector(`#${organId}`);
    if (!group) return;

    group.addEventListener('mouseenter', () => {
      if (selectedOrgan !== group) {
        group.style.filter = 'drop-shadow(0 0 8px white)';
        group.style.cursor = 'pointer';
      }
    });

    group.addEventListener('mouseleave', () => {
      if (selectedOrgan !== group) {
        group.style.filter = 'none';
        group.style.cursor = 'default';
      }
    });

    group.addEventListener('click', async () => {
      clearOrganSelection();
      selectedOrgan = group;
      group.style.filter = 'drop-shadow(0 0 12px white)';
      group.style.transform = 'none';

      const organName = getBaseOrganNameFromVariant(organId);
      const food = document.querySelector('#food-input').value.trim();
      const condition = document.getElementById('condition-select').value;
      if (!food) {
        alert('Please enter a food first!');
        clearOrganSelection();
        return;
      }

      showLoadingModal();
      try {
        const explanation = await fetchOrganExplanation(food, organName, condition);
        const score = organScores[organName];
        showModal(organName, score, explanation);
      } catch {
        showModal(organName, null, 'Sorry, failed to get explanation from AI.');
      }
    });
  });
}

function clearOrganSelection() {
  if (selectedOrgan) {
    selectedOrgan.style.filter = 'none';
    selectedOrgan.style.transform = 'none';
    selectedOrgan = null;
  }
}

function getBaseOrganNameFromVariant(variantId) {
  for (const [base, variants] of Object.entries(organVariants)) {
    if (variants.includes(variantId)) return base;
  }
  return variantId;
}

async function fetchOrganExplanation(food, organ, condition) {
  const res = await fetch('https://foodmood-backend1.onrender.com/organ-explanation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ food, organ, condition }),
  });
  if (!res.ok) throw new Error('Failed to fetch explanation');
  const data = await res.json();
  return data.explanation;
}

function showLoadingModal() {
  const modal = document.getElementById('organ-modal');
  modal.querySelector('.modal-title').textContent = 'Loading...';
  modal.querySelector('.modal-body').textContent = '';
  modal.style.display = 'flex';
}

function showModal(organ, score, explanation) {
  const modal = document.getElementById('organ-modal');
  const displayedScore = score !== null && score !== undefined ? (100 - score) : null;
  const readableName = organ.replace(/([a-z])([A-Z])/g, '$1 $2');
  const title = displayedScore !== null
    ? `${readableName} — Score: ${displayedScore}/100`
    : `${readableName}`;
  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-body').innerHTML = formatAIMessage(explanation);
  modal.style.display = 'flex';
}

function hideModal() {
  const modal = document.getElementById('organ-modal');
  modal.style.display = 'none';
  clearOrganSelection();
}

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const question = input.value.trim();
  const condition = document.getElementById('condition-select').value;
  if (!question) return;

  addMessageToChatLog('You', question);
  input.value = '';

  try {
    const res = await fetch('https://foodmood-backend1.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: question, condition }),
    });

    const data = await res.json();
    addMessageToChatLog('AI', data.response || 'Hmm... I couldn’t come up with a good answer!');
  } catch (err) {
    addMessageToChatLog('AI', 'Sorry, something went wrong with the server.');
  }
});

function addMessageToChatLog(sender, message) {
  const chatLog = document.getElementById('chat-log');
  const p = document.createElement('p');
  p.innerHTML = `<strong>${sender}:</strong> ${formatAIMessage(message)}`;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function formatAIMessage(text) {
  if (!text) return '';
  let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  safeText = safeText
    .replace(/## (.+)/g, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
  return safeText;
}

document.getElementById('open-chatbot').addEventListener('click', () => {
  document.getElementById('chatbot-modal').style.display = 'flex';
});

document.getElementById('close-chatbot').addEventListener('click', () => {
  document.getElementById('chatbot-modal').style.display = 'none';
});
