/**
 * Vendor services barrel.
 * Pages may import from here or from individual service files.
 */
export { authService } from './authService'
export { dashboardService } from './dashboardService'
export { orderService } from './orderService'
export { productService } from './productService'
export { branchService } from './branchService'
export { staffService } from './staffService'
export { promotionService } from './promotionService'
export { notificationService } from './notificationService'
export { vendorProfileService } from './vendorProfileService'
export {
  vendorUploadService,
  validateVendorImageFile,
  VENDOR_IMAGE_UPLOAD_ACCEPT,
  VENDOR_IMAGE_UPLOAD_MAX_BYTES,
} from './uploadService'
