import express from 'express';
import multer from 'multer';
import { 
  register, 
  login, 
  logout, 
  registerFace, 
  getMe, 
  updateProfile,
  sendOtpController,
  verifyOtpController,
  resetPassword
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/send-otp', sendOtpController);
router.post('/verify-otp', verifyOtpController);
router.post('/reset-password', resetPassword);
router.post('/face-register', protect, upload.single('file'), registerFace);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;

