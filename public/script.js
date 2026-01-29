document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  // Maintain conversation history to send to the backend
  let conversation = [];

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Add user message to the chat box
    addMessage("User", text);
    userInput.value = "";

    // Update local conversation history
    conversation.push({ role: "user", text });

    // 2. Show temporary "Thinking..." message
    const loadingId = `msg-${Date.now()}`;
    addMessage("Bot", "Thinking...", loadingId);

    try {
      // 3. Send POST request to backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      // 4. Replace "Thinking..." with AI's reply
      if (data.result) {
        updateMessage(loadingId, "Bot", data.result);
        conversation.push({ role: "model", text: data.result });
      } else {
        updateMessage(loadingId, "Bot", "Sorry, no response received.");
      }
    } catch (error) {
      console.error("Error:", error);
      // 5. Handle errors
      updateMessage(loadingId, "Bot", "Failed to get response from server.");
    }
  });

  // Helper function to format text (bolding **text**)
  function formatText(text) {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    return escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  function addMessage(sender, text, id = null) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(
      "message",
      sender === "User" ? "user-message" : "bot-message",
    );
    if (id) {
      messageDiv.id = id;
    }
    if (sender === "Bot" && text === "Thinking...") {
      messageDiv.innerHTML = `
        <div class="loader-container">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>`;
    } else {
      // Apply formatting only for Bot messages, use textContent for User to be safe
      if (sender === "Bot") {
        messageDiv.innerHTML = formatText(text);
      } else {
        messageDiv.textContent = text;
      }
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
  }

  function updateMessage(id, sender, text) {
    const messageDiv = document.getElementById(id); // sender is always 'Bot'
    if (messageDiv) {
      // Update content with formatting
      messageDiv.innerHTML = formatText(text);

      // Remove the temporary ID
      messageDiv.removeAttribute("id");
    }
  }
});
