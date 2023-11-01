class ChatWidget {
  constructor() {
    this.initStyles();
    this.createChatWidget();
    this.attachEventListeners();
  }

  initStyles() {
    // Custom styles for chat widget
    const style = document.createElement('style');
    style.innerHTML = `
    .chat-message-user {
      display: inline-block;
      padding: 10px 15px;
      border-radius: 18px;
      background-color: #a6d8ff;  // Darker shade
      color: white;
      max-width: 80%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .chat-message-assistant {
      display: inline-block;
      padding: 10px 15px;
      border-radius: 18px;
      background-color: #ecf0f1;  // Lighter shade
      color: #2c3e50;  // Dark text for light background
      max-width: 80%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    pre {
      white-space: pre-wrap;       /* Since CSS 2.1 */
      white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
      white-space: -pre-wrap;      /* Opera 4-6 */
      white-space: -o-pre-wrap;    /* Opera 7 */
      word-wrap: break-word;       /* Internet Explorer 5.5+ */
      padding: 0;
      margin: 0;
    }

    #chat-input {
      height: auto;
      max-height: 20vh;
      overflow-y: auto;
      resize: none !important;
    }

    .copy-button {
      padding: 0;
      border: none;
      margin: 0;
      margin-top: 2px;
    }

    .copy-button:hover {
      color: #a6d8ff; // Change color on hover for visual feedback
    }
  
    `;
    document.head.appendChild(style);
  }

  createChatWidget() {
    const annotationElement = document.querySelector('.annotation_schema');
    if (!annotationElement) return; // Ensure the element exists

    // Traverse up to locate the closest parent with class col-md-12
    const annotationBox = annotationElement.closest('.col-md-12');
    if (!annotationBox) return;  // Ensure the element exists

    // Modify the class of the found col-md-12 element to col-md-8
    annotationBox.classList.remove('col-md-12');
    annotationBox.classList.add('col-md-8');
    annotationBox.classList.add('justify-content-end');

    // Get the computed height of the annotation box
    const annotationComputedHeight = window.getComputedStyle(annotationBox).height;
    // widgetHeight is the minimum of 80vh and the computed height of the annotation box
    const widgetHeight = Math.min(window.innerHeight, parseInt(annotationComputedHeight));

    // Create chat window as col-md-4
    const chatColumn = document.createElement('div');
    chatColumn.classList.add('col-md-4');
    chatColumn.classList.add('justify-content-start');

    chatColumn.innerHTML = `
    <div id="chat-widget" class="card d-flex flex-column" style="height: 100%; max-height: ${widgetHeight};">
      <div class="card-header d-flex justify-content-between align-items-center">
          <span>Chat with Large Language Models</span>
      </div>
      <div id="chat-messages" class="card-body overflow-auto flex-grow-1" style="height: 100%;">
      </div>
      <form class="form-inline p-3">
          <div class="d-flex w-100 flex-wrap">
              <textarea id="chat-input" class="form-control flex-grow-1 mb-1 mr-1" rows="1" placeholder="Ask anything..." style="resize: vertical; overflow-y: auto;"></textarea>
              <button id="chat-submit" type="submit" class="btn btn-secondary mb-1">Send</button>
          </div>
      </form>
  
    </div>
    `;
    // Insert the chat window next to the col-md-8 element
    annotationBox.parentNode.appendChild(chatColumn);
    this.container = chatColumn;
    this.annotationBox = annotationBox;
  }


  attachEventListeners() {
    // Add event listener to the textarea
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keydown', function (event) {
      // Check if Enter key is pressed
      if (event.key === 'Enter') {
        // If Shift key is also held down, just add a newline and return
        if (event.shiftKey) {
          return;
        }

        // Otherwise, prevent default newline and submit the form
        event.preventDefault();
        // Assuming you have a function to handle the form submission
        // submitFormFunction();
        document.getElementById('chat-submit').click();
      }
    });

    this.submitButton = this.container.querySelector('#chat-submit');
    this.chatForm = this.container.querySelector('form'); // Store the form in a class property for easy access
    this.chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const message = this.container.querySelector('#chat-input').value.trim();
      // Clear the input
      this.container.querySelector('#chat-input').value = '';

      if (!message) return;
      this.onUserRequest(message);
    });

    // Initial chat setup
    const instanceContent = this.extractInstanceContent();
    const annotationSchemaContent = this.extractAnnotationSchemaContent();

    // Maintain a list of messages to be sent to the server
    this.messages = [];

    if (instanceContent && annotationSchemaContent) {
      // Concatenate the two strings
      const message = instanceContent + '\n\n------\n\n' + annotationSchemaContent;
      this.onUserRequest(message);
    }
  }

  // ==== Chat Widget Methods ====
  addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'text-right mb-2';
    messageElement.innerHTML = `
    <pre class="chat-message-user text-left">${message}</pre>
    `;

    const chatMessagesContainer = this.container.querySelector('#chat-messages');
    chatMessagesContainer.appendChild(messageElement);

    // Scroll to the bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // Add the message 
    this.messages.push({
      role: 'user',
      content: message
    })

    console.log('Messages: ', this.messages);
  }

  addAssistantMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'text-left mb-2 chat-message-assistant';
    messageElement.innerHTML = `
    <pre>${message}</pre>
    <button class="btn btn-outlint-dark btn-sm copy-button float-right">
      <i class="far fa-copy"></i>&nbsp;Copy
    </button>
    `;

    const chatMessagesContainer = this.container.querySelector('#chat-messages');
    chatMessagesContainer.appendChild(messageElement);

    // Scroll to the bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // Add the message
    this.messages.push({
      role: 'assistant',
      content: message
    })
    // Attach the copy event to the button
    const copyButton = messageElement.querySelector('.copy-button');
    copyButton.addEventListener('click', () => {
      this.copyToClipboard(message);
    });
  }

  copyToClipboard(message) {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = message;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();

    // Increment the copy count
    const copyCountInput = document.getElementById('copy_count');
    let count = parseInt(copyCountInput.value, 10);
    copyCountInput.value = count + 1;
  }

  postData(url, data) {
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        // add other headers here if needed
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error('There was a problem:', error.message);
        // Handle the error as needed
      });
  }

  onUserRequest(message) {
    this.addUserMessage(message);
    // Disable the Send button
    this.submitButton.disabled = true;

    // post to /llm endpoint with this.messages
    const url = '/llm';
    const data = {
      'messages': this.messages,
    };

    this.postData(url, data)
      .then(data => {
        console.log(data);
        this.reply(data['content']);
      });
  }

  reply(message) {
    this.addAssistantMessage(message);
    // Re-enable the Send button
    this.submitButton.disabled = false;
  }

  // ==== Extracting Content from Annotation Box ====
  // Extract content from .instance
  extractInstanceContent() {
    const instanceElement = this.annotationBox.querySelector('.instance[name="context_text"]');
    return instanceElement ? instanceElement.innerText.trim() : null;
  }

  // Extract content from .annotation_schema
  extractAnnotationSchemaContent() {
    const schemaElement = this.annotationBox.querySelector('.annotation_schema legend');
    return schemaElement ? schemaElement.innerText.trim() : null;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // only initialize the chat widget if the enable_llm_chat is set to True
  const enableLLMChat = document.getElementById('enable_llm_chat').value;
  if (enableLLMChat === 'True') {
    new ChatWidget();
  }
});