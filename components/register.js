



const express = require('express');
const register = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const User = require('../Schema/User');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      const uploadPath = path.join(__dirname, '..', 'Uploads', 'DpImage');
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

register.post('/', upload.single('DpImage'), async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    const dpImagePath = req.file ? `/Uploads/DpImage/${req.file.filename}` : null;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      DpImage: dpImagePath,
    });

    await newUser.save();

    req.session.user = { _id: newUser._id };

    res.status(201).json({
      message: 'Registration successful. User created and session established.',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        DpImage: newUser.DpImage,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration. Please try again later.' });
  }
});

module.exports = register;