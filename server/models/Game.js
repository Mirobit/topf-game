import mongoose from 'mongoose';

const { Schema } = mongoose;

const gameSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
    },
    shortUrl: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    videoLink: {
      type: String,
      required: false,
    },
    rounds: {
      type: Number,
      required: true,
      default: 3,
    },
    timer: {
      type: Number,
      required: true,
      default: 60,
    },
    wordsCount: {
      type: Number,
      required: true,
      default: 3,
    },
    currentRound: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['new', 'started', 'ended'],
      default: 'new',
    },
    playOrder: [String],
    adminName: { type: String, required: true },
    players: [
      {
        name: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ['user', 'admin'],
          default: 'user',
        },
        status: {
          type: String,
          enum: [
            'new',
            'submitted',
            'ready',
            'playing',
            'explaining',
            'guessing',
            'disconnected',
            'quit',
          ],
          default: 'new',
        },
        score: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    words: [
      {
        string: {
          type: String,
          required: true,
        },
        guessed: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

export default mongoose.model('Games', gameSchema);
