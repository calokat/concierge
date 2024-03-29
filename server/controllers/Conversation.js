const models = require('../models');

const { Conversation } = models;

// writes a new conversation to the database
const createConversation = (req, res) => {
  const convoData = {
    title: req.body.title,
    owner: req.session.account._id,
  };
  // creates and saves a conversation with the convoData
  const newConvo = new models.Conversation.ConversationModel(convoData);

  const newConvoPromise = newConvo.save();

  newConvoPromise.then(() => {
    res.json({ success: true });
  });

  newConvoPromise.catch(() => {
    res.status(400).json({ error: 'An error occurred' });
  });
};

// finds the conversation that the current user created
const getConversations = (req, res) => {
  Conversation.ConversationModel.findByOwner(req.session.account._id, (err, docs) => {
    if (err) {
      return res.status(400).json({ error: 'An error occurred' });
    }
    return res.json({ convos: docs });
  });
};

// renders the chat pages for users and admins
const chatPage = (req, res) => {
  if (req.session.account.isAdmin) {
    res.render('chat-admin');
  } else {
    res.render('chat');
  }
};


module.exports.createConversation = createConversation;
module.exports.getConversations = getConversations;
module.exports.chatPage = chatPage;
