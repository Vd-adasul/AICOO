import express from 'express';
import User from '../models/User.js';
import Twin from '../models/Twin.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch user by ID error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// @desc    Create a user manually (e.g. for testing)
// @route   POST /api/users
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, email, password, role, bio, availability, yearsExperience } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role,
      bio,
      availability: availability || 'Available',
      yearsExperience: yearsExperience || 0
    });
    // Create twin
    await Twin.create({
      userId: user._id,
      skills: [],
      expertise: [],
      preferences: [],
      summary: `Digital Twin of ${user.name}, specializing in ${user.role}.`
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.availability = req.body.availability || user.availability;
    user.yearsExperience = req.body.yearsExperience !== undefined ? req.body.yearsExperience : user.yearsExperience;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      availability: updatedUser.availability,
      yearsExperience: updatedUser.yearsExperience
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Remove user and associated digital twin
    await Twin.findOneAndDelete({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User and associated Twin deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

export default router;
