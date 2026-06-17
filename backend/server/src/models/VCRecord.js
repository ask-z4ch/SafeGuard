import mongoose from 'mongoose';

const vcRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    hash: {
      type: String,
      required: true
    },
    transactionHash: {
      type: String,
      required: true
    },
    issuerDid: {
      type: String,
      required: true
    },
    verifiableCredential: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
);

const VCRecord = mongoose.model('VCRecord', vcRecordSchema);

export default VCRecord;
