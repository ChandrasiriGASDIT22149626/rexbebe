import { Router } from 'express';
import {
  getPages,
  getPageBySlug,
  createPage,
  updatePage,
  updatePageStatus,
  deletePage,
} from '../controllers/pageController';

const router = Router();

router.get('/', getPages);
router.post('/', createPage);
router.get('/:slug', getPageBySlug);
router.put('/:id', updatePage);
router.patch('/:id/status', updatePageStatus);
router.delete('/:id', deletePage);

export default router;
