const promptInput = document.getElementById('prompt');
const submitBtn = document.getElementById('submit');
const chatContainer = document.querySelector('.chat-container');
const imageBtn = document.getElementById('image');
const imageInput = imageBtn.querySelector('input');
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=myapikey";

let user = { message: null, file: { mime_type: null, data: null } };

async function generateResponse() {
    const loadingMessage = createMessageElement('<div class="loading-spinner"></div>', 'ai');
    chatContainer.appendChild(loadingMessage);
    const tempFile = { ...user.file };
    user.file = {};

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: user.message },
                        ...(tempFile.data ? [{ inline_data: tempFile }] : [])
                    ]
                }]
            })
        });
        const data = await response.json();
        const apiResponse = data.candidates[0].content.parts[0].text
            .replace(/\*\*(.*?)\*\*/g, "$1").trim();
        
        loadingMessage.remove();
        chatContainer.appendChild(createMessageElement(apiResponse, 'ai'));
    } catch (error) {
        console.error("Error:", error);
        loadingMessage.remove();
        chatContainer.appendChild(createMessageElement("Sorry, I'm having trouble responding right now.", 'ai'));
    } finally {
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
        resetImageButton();
    }
}

function createMessageElement(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    const imgContent = (type === 'user' && user.file.data) 
        ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />`
        : '';

    messageDiv.innerHTML = type === 'ai' ? `
        <div class="avatar ai-avatar"></div>
        <div class="message-content">${content}</div>
    ` : `
        <div class="message-content">
            ${imgContent}
            <div>${content}</div>
        </div>
        <div class="avatar user-avatar"></div>
    `;
    return messageDiv;
}

function handleUserMessage(message) {
    user.message = message;
    chatContainer.appendChild(createMessageElement(message, 'user'));
    promptInput.value = '';
    generateResponse();
}

function resetImageButton() {
    imageBtn.querySelector('svg').innerHTML = `
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5-5 5-3-3-3 4"/>`;
    user.file = {};
}

// Event Listeners
promptInput.addEventListener('keypress', (e) => e.key === 'Enter' && promptInput.value.trim() && handleUserMessage(promptInput.value.trim()));
submitBtn.addEventListener('click', () => promptInput.value.trim() && handleUserMessage(promptInput.value.trim()));
imageBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith('image/')) return alert('Please select a valid image file');
    
    const reader = new FileReader();
    reader.onload = (event) => {
        user.file = { mime_type: file.type, data: event.target.result.split(',')[1] };
        imageBtn.querySelector('svg').innerHTML = `
            <circle cx="12" cy="12" r="9" fill="#4CAF50"/>
            <path fill="white" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>`;
    };
    reader.onerror = (error) => {
        console.error('File error:', error);
        alert('Error reading image file');
        resetImageButton();
    };
    reader.readAsDataURL(file);
});

chatContainer.scrollTo(0, chatContainer.scrollHeight);
