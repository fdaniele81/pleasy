import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import projectDraftController from '../controllers/projectDraftController.js';

const router = express.Router();

router.post('/',
  verifyToken,
  checkRole(['ADMIN', 'PM']),
  projectDraftController.createOrUpdate
);

router.get('/:project_draft_id',
  verifyToken,
  checkRole(['ADMIN', 'PM', 'USER']),
  projectDraftController.getById
);

router.get('/estimate/:estimate_id',
  verifyToken,
  checkRole(['ADMIN', 'PM']),
  projectDraftController.getByEstimateId
);

router.delete('/:project_draft_id',
  verifyToken,
  checkRole(['ADMIN', 'PM']),
  projectDraftController.remove
);

router.get('/check-key/:project_key',
  verifyToken,
  checkRole(['ADMIN', 'PM']),
  projectDraftController.checkProjectKey
);

router.post('/:project_draft_id/convert',
  verifyToken,
  checkRole(['ADMIN', 'PM']),
  projectDraftController.convert
);

export default router;
