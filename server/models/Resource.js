const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    type: {
        type: String,
        required: true,
        enum: ['article', 'video', 'document', 'link', 'other'],
        default: 'link'
    },
    link: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: false
    },
    discussion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discussion',
        required: false
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
resourceSchema.index({ author: 1 });
resourceSchema.index({ community: 1 });
resourceSchema.index({ discussion: 1 });
resourceSchema.index({ type: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
