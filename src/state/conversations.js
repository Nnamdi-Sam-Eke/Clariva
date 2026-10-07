export function createInitialConversations(threads) {
  return threads.map((thread) => ({
    guest: thread.guest,
    unread: thread.unread,
    messages: [
      {
        id: `${thread.guest}-seed-1`,
        sender: 'guest',
        text: 'Hi! Just confirming check-in time for our stay.',
      },
      {
        id: `${thread.guest}-seed-2`,
        sender: 'agent',
        text: 'Hi, check-in opens at 3pm — I’ll send the door code the morning of.',
      },
      {
        id: `${thread.guest}-seed-3`,
        sender: 'guest',
        text: thread.last,
      },
    ],
  }));
}

export function isConversationArray(value) {
  return Array.isArray(value) && value.every((conversation) => (
    conversation !== null
    && typeof conversation === 'object'
    && typeof conversation.guest === 'string'
    && Number.isInteger(conversation.unread)
    && conversation.unread >= 0
    && Array.isArray(conversation.messages)
    && conversation.messages.every((message) => (
      message !== null
      && typeof message === 'object'
      && typeof message.id === 'string'
      && (message.sender === 'guest' || message.sender === 'agent')
      && typeof message.text === 'string'
    ))
  ));
}
