const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const _ = require('underscore');

let ConversationModel = {};

let ConversationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    owner: {
        required: true,
        type: mongoose.Schema.ObjectId,
        ref: 'Account'
    }
});

ConversationSchema.statics.findByOwner = (owner, callback) => {
    let search = {
        owner
    };
    return ConversationModel.find(search).exec(callback);
}

ConversationModel = mongoose.model('Conversation', ConversationSchema);

module.exports.ConversationModel = ConversationModel;
module.exports.ConversationSchema = ConversationSchema;