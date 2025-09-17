const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  mobile: {
    type: String,
    required: true,
    match: [/^\+?\d{10,15}$/, 'Please enter a valid phone number']

  },
  DpImage: String,
  profileImage: String,
  password: { type: String, required: true },
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
  currentPlace: [{ type: String, default: 'Unknown' }],
  gender: { type: String },
  orientation: { type: String },
  maritalStatus: { type: String },
  dob: Date,
  height: Number,
  weight: Number,
  education: String,
  profession: String,
  income: String,
  languages: String,
  habits: { type: String },
  diet: { type: String },
  partnerExpectations: String,
  disability: String,
  relocate: String,
  familyDetails: String,
  horoscope: String,
  Address:String,
  sentInterests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  receivedInterests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  acceptedInterests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

