const mongoose = require('mongoose')
const Schema = mongoose.Schema

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
    wordsNo: {
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
          enum: ['new', 'ready', 'playing', 'explaining', 'guessing', 'left'],
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
        player: {
          type: Schema.Types.ObjectId,
          required: true,
        },
      },
    ],
    //   admin: { type: Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

module.exports = mongoose.model('Games', gameSchema)
