const express = require('express');
const information = express.Router();
const checkAuth = require('../Auth/checkAuth');
const User = require('../Schema/User');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and GIF images are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

information.get('/', checkAuth, async (req, res) => {
  try {
    const userId = req.session.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID not found in session.' });
    }

    const userData = await User.findById(userId).select(
      'country state district religion branch caste previousReligion previousReligionBranch ' +
      'familyReligion familyReligionBranch certificateReligion currentPlace profileImage gender orientation ' +
      'maritalStatus dob height weight education profession income languages habits diet partnerExpectations ' +
      'disability relocate familyDetails horoscope Address'
    );

    if (!userData) {
      return res.status(404).json({ message: 'User information not found.' });
    }

    const responseData = {
      ...userData._doc,
      currentPlace: Array.isArray(userData.currentPlace) ? userData.currentPlace[0] || '' : userData.currentPlace || ''
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user information:', error.message, error.stack);
    return res.status(500).json({ message: 'Server error while fetching user information.' });
  }
});

information.post('/', checkAuth, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.session.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID not found in session.' });
    }

    const {
      country, state, district, religion, branch, caste, previousReligion, previousReligionBranch,
      familyReligion, familyReligionBranch, certificateReligion, currentPlace, gender, orientation,
      maritalStatus, dob, height, weight, education, profession, income, languages, habits, diet,
      partnerExpectations, disability, relocate, familyDetails, horoscope, Address
    } = req.body;

    const errors = {};
    if (!country) errors.country = 'Country is required';
    if (!gender) errors.gender = 'Gender is required';
    if (!dob) errors.dob = 'Date of birth is required';
    if (!religion) errors.religion = 'Religion is required';
    if (!height) errors.height = 'Height is required';
    if (!weight) errors.weight = 'Weight is required';
    if (!education) errors.education = 'Education is required';
    if (!profession) errors.profession = 'Profession is required';
    if (!income) errors.income = 'Income is required';
    if (!languages) errors.languages = 'Languages Known is required';
    if (!habits) errors.habits = 'Habits is required';
    if (!diet) errors.diet = 'Diet Preference is required';
    if (!partnerExpectations) errors.partnerExpectations = 'Partner Expectations is required';
    if (!familyDetails) errors.familyDetails = 'Family Background is required';
    if (!horoscope) errors.horoscope = 'Horoscope / Zodiac is required';
    if (!Address) errors.Address = 'Address is required';
    if (!currentPlace) errors.currentPlace = 'Current Place of Residence is required';
    if (!maritalStatus) errors.maritalStatus = 'Marital Status is required';
    if (!orientation) errors.orientation = 'Sexual Orientation is required';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const profileImagePath = req.file ? `/Uploads/images/${req.file.filename}` : null;

    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.country = country;
    user.state = state;
    user.district = district;
    user.religion = religion;
    user.branch = branch;
    user.caste = caste;
    user.previousReligion = previousReligion;
    user.previousReligionBranch = previousReligionBranch;
    user.familyReligion = familyReligion;
    user.familyReligionBranch = familyReligionBranch;
    user.certificateReligion = certificateReligion;
    user.currentPlace = currentPlace;
    if (profileImagePath) {
      user.profileImage = profileImagePath;
    }
    user.gender = gender;
    user.orientation = orientation;
    user.maritalStatus = maritalStatus;
    user.dob = dob;
    user.height = height;
    user.weight = weight;
    user.education = education;
    user.profession = profession;
    user.income = income;
    user.languages = languages;
    user.habits = habits;
    user.diet = diet;
    user.partnerExpectations = partnerExpectations;
    user.disability = disability;
    user.relocate = relocate;
    user.familyDetails = familyDetails;
    user.horoscope = horoscope;
    user.Address = Address;

    await user.save();

    res.status(201).json({ message: 'Information saved successfully', user });
  } catch (error) {
    console.error("Error saving user information:", error);
    res.status(500).json({ message: 'Server error while saving user information.' });
  }
});

information.put('/', checkAuth, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.session.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID not found in session.' });
    }

    const updatedData = { ...req.body };

    if (req.file) {
      updatedData.profileImage = `/Uploads/images/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true, runValidators: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'Information updated successfully', user: updatedUser });
  } catch (error) {
    console.error("Error updating user information:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while updating user information.' });
  }
});

module.exports = information;


// const express = require('express');
// const information = express.Router();
// const checkAuth = require('../Auth/checkAuth'); // Middleware to check authentication
// const User = require('../Schema/User'); // Your Mongoose User model
// const multer = require('multer'); // For handling file uploads


// // Configure Multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // Specify the directory where uploaded files will be stored
//     cb(null, 'Uploads/images'); // Change to your desired upload directory
//   },
//   filename: (req, file, cb) => {
//     // Generate a unique filename to prevent collisions
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({ storage: storage });

// // GET /information route: Fetches all detailed user information for the authenticated user
// information.get('/', checkAuth, async (req, res) => {
//   try {
//     const userId = req.session.user?._id;

//     if (!userId) {
//       return res.status(401).json({ message: 'Unauthorized: User ID not found in session.' });
//     }

//     // Fetch all user data fields for the authenticated user
//     const userData = await User.findById(userId).select(
//       'country state district religion branch caste previousReligion previousReligionBranch ' +
//       'familyReligion familyReligionBranch certificateReligion currentPlace profileImage gender orientation ' +
//       'maritalStatus dob height weight education profession income languages habits diet partnerExpectations ' +
//       'disability relocate familyDetails horoscope Address'
//     );

//     if (userData) {
//       // If user data is found, send it back as a JSON response
//       return res.status(200).json(userData);
//     } else {
//       // If user data is not found, send a 404 Not Found response
//       return res.status(404).json({ message: 'User information not found.' });
//     }
//   } catch (error) {
//     console.error("Error fetching user information:", error);
//     res.status(500).json({ message: 'Server error while fetching user information.' });
//   }
// });

// // POST /information route: Creates new detailed user information for the authenticated user
// // Use upload.single('profileImage') to handle the single file upload for 'profileImage'
// information.post('/', checkAuth, upload.single('profileImage'), async (req, res) => {
//   try {
//     const userId = req.session.user?._id;

//     if (!userId) {
//       return res.status(401).json({ message: 'Unauthorized: User ID not found in session.' });
//     }

//     // Extract data from request body
//     const {
//       country, state, district, religion, branch, caste, previousReligion, previousReligionBranch,
//       familyReligion, familyReligionBranch, certificateReligion, currentPlace,
//       gender, orientation, maritalStatus, dob, height, weight, education, profession, income,
//       languages, habits, diet, partnerExpectations, disability,
//       relocate, familyDetails, horoscope, Address
//     } = req.body;

//     // Get the path to the uploaded profile image, if any
//     const profileImagePath = req.file ? `/Uploads/${req.file.filename}` : null;

//     // Find the user by ID
//     let user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     // Update the user document with the new information
//     // Note: If you want to create a *new* document for information separate from the User model,
//     // you would use a different Mongoose model here (e.g., new UserProfile({ ... })).
//     // Assuming 'User' model holds all this information directly.
//     user.country = country;
//     user.state = state;
//     user.district = district;
//     user.religion = religion;
//     user.branch = branch;
//     user.caste = caste;
//     user.previousReligion = previousReligion;
//     user.previousReligionBranch = previousReligionBranch;
//     user.familyReligion = familyReligion;
//     user.familyReligionBranch = familyReligionBranch;
//     user.certificateReligion = certificateReligion;
//     user.currentPlace = currentPlace;
//     if (profileImagePath) {
//       user.profileImage = profileImagePath; // Only update if a new image was uploaded
//     }
//     user.gender = gender;
//     user.orientation = orientation;
//     user.maritalStatus = maritalStatus;
//     user.dob = dob;
//     user.height = height;
//     user.weight = weight;
//     user.education = education;
//     user.profession = profession;
//     user.income = income;
//     user.languages = languages;
//     user.habits = habits;
//     user.diet = diet;
//     user.partnerExpectations = partnerExpectations;
//     user.disability = disability;
//     user.relocate = relocate;
//     user.familyDetails = familyDetails;
//     user.horoscope = horoscope;
//     user.Address = Address;

//     await user.save(); // Save the updated user document

//     res.status(201).json({ message: 'Information saved successfully', user: user });
//   } catch (error) {
//     console.error("Error saving user information:", error);
//     res.status(500).json({ message: 'Server error while saving user information.' });
//   }
// });

// // PUT /information route: Updates existing detailed user information for the authenticated user
// // Use upload.single('profileImage') for updates as well, as profileImage might be updated
// information.put('/', checkAuth, upload.single('profileImage'), async (req, res) => {
//   try {
//     const userId = req.session.user?._id;

//     if (!userId) {
//       return res.status(401).json({ message: 'Unauthorized: User ID not found in session.' });
//     }

//     // Prepare updated data from request body
//     const updatedData = { ...req.body };

//     // If a new profile image was uploaded, update its path
//     if (req.file) {
//       updatedData.profileImage = `/Uploads/${req.file.filename}`;
//     }

//     // Find and update the user document by ID
//     // { new: true } returns the updated document
//     const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true, runValidators: true });

//     if (!updatedUser) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     res.status(200).json({ message: 'Information updated successfully', user: updatedUser });
//   } catch (error) {
//     console.error("Error updating user information:", error);
//     // Handle Mongoose validation errors or other server errors
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({ message: error.message, errors: error.errors });
//     }
//     res.status(500).json({ message: 'Server error while updating user information.' });
//   }
// });

// module.exports = information;
