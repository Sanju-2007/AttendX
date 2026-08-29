import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
  getDashboardStats,
  createDepartment,
  getPendingTeachers,
  approveTeacher,
  createSubject,
  createSection,
  assignTimetable,
  deleteTimetable,
  deleteSubject,
  deleteSection,
  generateTeacherInviteToken,
  getAdminData
} from '../controllers/adminController';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/data', getAdminData);
router.post('/departments', createDepartment);
router.get('/teachers/pending', getPendingTeachers);
router.put('/teachers/:id/approve', approveTeacher);
router.post('/teachers/invite-token', generateTeacherInviteToken);
router.post('/subjects', createSubject);
router.delete('/subjects/:id', deleteSubject);
router.post('/sections', createSection);
router.delete('/sections/:id', deleteSection);
router.post('/timetables', assignTimetable);
router.delete('/timetables/:id', deleteTimetable);

export default router;
