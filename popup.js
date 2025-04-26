document.getElementById('generate').addEventListener('click', async () => {
  const topic = document.getElementById('topic').value.trim();
  const numQuestions = parseInt(document.getElementById('numQuestions').value);
  const difficulty = document.getElementById('difficulty').value;

  if (!topic) {
    alert("Please enter a topic.");
    return;
  }
  if (isNaN(numQuestions) || numQuestions < 1) {
    alert("Please enter a valid number of questions.");
    return;
  }

  // send all data to content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: generateQuizInForm,
    args: [topic, numQuestions, difficulty]
  });
});

// This function will run inside the Google Forms page
function generateQuizInForm(topic, numQuestions, difficulty) {
  const formDiv = document.querySelector('div[role="list"]');
  if (!formDiv) {
    alert("Can't find form editor.");
    return;
  }

  const difficultyWords = {
    easy: ["basic", "simple", "introductory"],
    medium: ["intermediate", "important", "essential"],
    hard: ["advanced", "complex", "challenging"]
  };

  const adjectives = difficultyWords[difficulty] || ["related"];

  for (let i = 0; i < numQuestions; i++) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const questionText = `What is a ${adjective} concept in ${topic}?`;

    // Simulate clicking "Add Question"
    const addButton = document.querySelector('[aria-label="Add question"]');
    if (addButton) {
      addButton.click();

      setTimeout(() => {
        const inputs = document.querySelectorAll('input[aria-label="Question title"]');
        if (inputs.length > 0) {
          const lastInput = inputs[inputs.length - 1];
          lastInput.value = questionText;
          lastInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 500 * (i + 1)); // slight delay for each question
    }
  }

  setTimeout(() => {
    alert(`${numQuestions} ${difficulty} questions added!`);
  }, 500 * (numQuestions + 1));
}
