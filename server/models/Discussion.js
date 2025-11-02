const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isEdited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const discussionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    category: {
        type: String,
        required: true,
        enum: ['General', 'Technology', 'Science', 'Arts', 'Sports', 'Politics', 'Other'],
        default: 'General'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    comments: [commentSchema],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 20
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ category: 1 });
discussionSchema.index({ author: 1 });
discussionSchema.index({ community: 1 });
discussionSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Discussion', discussionSchema);
