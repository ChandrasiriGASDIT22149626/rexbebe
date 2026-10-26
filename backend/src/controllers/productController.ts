import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';

const productService = new ProductService();

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const products = await productService.getProducts(req.query);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundError(`Product with slug '${slug}' not found`);
    }
    return sendSuccess(res, product, 'Product details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.createProduct(req.body);
    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    if (!product) {
      throw new NotFoundError(`Product with id '${id}' not found`);
    }
    return sendSuccess(res, product, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
};

export const duplicateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await productService.duplicateProduct(id);
    if (!product) {
      throw new NotFoundError(`Product with id '${id}' not found`);
    }
    return sendSuccess(res, product, 'Product duplicated successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const success = await productService.deleteProduct(id);
    if (!success) {
      throw new NotFoundError(`Product with id '${id}' not found`);
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return sendSuccess(res, { deleted: true, id }, 'The item has been permanently deleted.');
  } catch (err) {
    next(err);
  }
};

export const toggleBestSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await productService.toggleBestSeller(id);
    if (!product) {
      throw new NotFoundError(`Product with id '${id}' not found`);
    }
    return sendSuccess(res, product, 'Product Best Seller status updated');
  } catch (err) {
    next(err);
  }
};

export const toggleNewArrival = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await productService.toggleNewArrival(id);
    if (!product) {
      throw new NotFoundError(`Product with id '${id}' not found`);
    }
    return sendSuccess(res, product, 'Product New Arrival status updated');
  } catch (err) {
    next(err);
  }
};

export const toggleFeatured = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await productService.toggleFeatured(id);
    if (!product) {
      throw new NotFoundError(`Product with id '${id}' not found`);
    }
    return sendSuccess(res, product, 'Product Featured status updated');
  } catch (err) {
    next(err);
  }
};

export const updateProductStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const product = await productService.updateStatus(id, status);
    if (!product) {
      throw new NotFoundError(`Product with id '${id}' not found`);
    }
    return sendSuccess(res, product, `Product status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};
