import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
  getMyAttendance,
  registerFaceEmbedding,
  scanQRRegistration,
  getMyEnrollment,
  joinSection
} from '../controllers/studentController';

const router = express.Router();

router.use(protect);
router.use(authorize('STUDENT'));

const upload = multer({ storage: multer.memoryStorage() });

router.get('/attendance', getMyAttendance);
router.get('/enrollment', getMyEnrollment);
router.post('/join-section', joinSection);
router.post('/face-register', upload.single('file'), registerFaceEmbedding);
router.post('/scan-qr', scanQRRegistration);

export default router;
