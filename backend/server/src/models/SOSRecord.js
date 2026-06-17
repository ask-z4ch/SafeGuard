import mongoose from 'mongoose';

const sosRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    messageType: {
      type: String,
      enum: ['default', 'custom'],
      default: 'default'
    },
    messageText: {
      type: String,
      required: true
    },
    audio: {
      fileName: String,
      originalName: String,
      mimeType: String,
      size: Number
    },
    location: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

const SOSRecord = mongoose.model('SOSRecord', sosRecordSchema);

export default SOSRecord;
