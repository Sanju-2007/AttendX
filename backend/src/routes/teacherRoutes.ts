import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
  getMyTimetable,
  generateQR,
  saveAttendance,
  updateManualAttendance,
  getTeacherData,
  createTimetable,
  allowStudentSectionChange
} from '../controllers/teacherController';

const router = express.Router();

router.use(protect);
router.use(authorize('TEACHER'));

const upload = multer({ storage: multer.memoryStorage() });

router.get('/data', getTeacherData);
router.post('/timetable', createTimetable);
router.get('/timetable', getMyTimetable);
router.post('/generate-qr', generateQR);
router.post('/attendance', upload.single('file'), saveAttendance);
router.put('/attendance/manual', updateManualAttendance);
router.post('/allow-class-change', allowStudentSectionChange);

export default router;
