

const express = require("express");
const home = express.Router();
const checkAuth = require("../Auth/checkAuth");
const User = require("../Schema/User");

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  // Validate age to prevent unrealistic values
  if (age < 0 || age > 120) {
    console.warn(`Invalid age calculated: ${age} for dob: ${dob}`);
    return null;
  }
  return age;
};

home.get("/", checkAuth, async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const { gender, orientation, sentInterests = [] } = currentUser;

    const {
      name, country, state, maritalStatus, currentPlace,
      profession, education, age, height, weight,
      religion, caste, income
    } = req.query;

    let query = { _id: { $ne: userId } };

    if (name) query.name = { $regex: name, $options: "i" };
    if (country) query.country = country;
    if (state) query.state = state;
    if (maritalStatus) query.maritalStatus = maritalStatus;
    if (currentPlace) query.currentPlace = { $regex: currentPlace, $options: "i" };
    if (profession) query.profession = { $regex: profession, $options: "i" };
    if (education) query.education = { $regex: education, $options: "i" };
    if (religion) query.religion = { $regex: religion, $options: "i" };
    if (caste) query.caste = { $regex: caste, $options: "i" };
    if (income) query.income = { $regex: income, $options: "i" };

    if (age) {
      const minDob = new Date();
      const maxDob = new Date();
      minDob.setFullYear(minDob.getFullYear() - parseInt(age) - 5);
      maxDob.setFullYear(maxDob.getFullYear() - parseInt(age) + 5);
      query.dob = { $gte: minDob, $lte: maxDob };
    }

    if (height) {
      query.height = { $gte: parseInt(height) - 5, $lte: parseInt(height) + 5 };
    }

    if (weight) {
      query.weight = { $gte: parseInt(weight) - 5, $lte: parseInt(weight) + 5 };
    }

    if (orientation === "Heterosexual") {
      if (gender === "Man") query.gender = "Woman";
      else if (gender === "Woman") query.gender = "Man";
    } else if (["Homosexual", "Gay", "Lesbian"].includes(orientation)) {
      query.gender = gender;
      query.orientation = { $in: ["Homosexual", "Gay", "Lesbian"] };
    } else {
      query.orientation = orientation;
    }

    const compatibleUsers = await User.find(query);

    const formattedUsers = Array.isArray(compatibleUsers) ? compatibleUsers.map((user) => ({
      id: user._id,
      name: user.name,
      age: calculateAge(user.dob),
      height: user.height,
      weight: user.weight,
      profession: user.profession,
      location: user.currentPlace?.[0] || "N/A",
      maritalStatus: user.maritalStatus,
      education: user.education,
      religion: user.religion,
      caste: user.caste,
      income: user.income,
      DpImage: user.DpImage,
    })) : [];

    res.status(200).json({
      currentUser: {
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        gender: currentUser.gender,
        orientation: currentUser.orientation,
        sentInterests,
      },
      compatibleUsers: formattedUsers,
    });
  } catch (err) {
    console.error("Home Route Error:", err.message, err.stack);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = home;