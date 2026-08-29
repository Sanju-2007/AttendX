import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { downloadAttendanceReport } from '../controllers/reportController';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'TEACHER'));

router.get('/download', downloadAttendanceReport);

export default router;
