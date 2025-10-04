const mongoose = require('mongoose');

const HistoryOfRemoveAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  userDetails: {
    type: {
      name: String,
      email: String,
      mobile: String,
      DpImage: String,
      profileImage: String,
      country: String,
      state: String,
      district: String,
      religion: String,
      Address: String,
      branch: String,
      caste: String,
      previousReligion: String,
      previousReligionBranch: String,
      familyReligion: String,
      familyReligionBranch: String,
      certificateReligion: String,
      currentPlace: [String],
      gender: String,
      orientation: String,
      maritalStatus: String,
      dob: Date,
      height: Number,
      weight: Number,
      education: String,
      profession: String,
      income: String,
      languages: String,
      habits: String,
      diet: String,
      partnerExpectations: String,
      disability: String,
      relocate: String,
      familyDetails: String,
      horoscope: String,
    },
    required: true,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  reports: [
    {
      reporter: {
        type: {
          _id: mongoose.Schema.Types.ObjectId,
          name: String,
          email: String,
          mobile: String,
          Address: String,
        },
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  deletedAt: {
    type: Date,
    default: Date.now,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  reason: {
    type: String,
    default: 'No reason provided',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('HistoryOfRemoveAccount', HistoryOfRemoveAccountSchema);

