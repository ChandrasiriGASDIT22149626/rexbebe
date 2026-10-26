import { Router } from 'express';
import {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  updateCollectionStatus,
  deleteCollection,
} from '../controllers/collectionController';

const router = Router();

router.get('/', getCollections);
router.post('/', createCollection);
router.get('/:id', getCollectionById);
router.put('/:id', updateCollection);
router.patch('/:id/status', updateCollectionStatus);
router.delete('/:id', deleteCollection);

export default router;
