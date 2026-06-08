<?php

use App\Http\Controllers\AdminAttributeSetController;
use App\Http\Controllers\AdminBrandController;
use App\Http\Controllers\AdminCategoryController;
use App\Http\Controllers\AdminOfferController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\AdminUnitController;
use App\Http\Controllers\AdminUploadController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CloudinaryController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\FrontendDataController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes (no auth required)
|--------------------------------------------------------------------------
*/

// Storefront data (navbar, hero, categories, settings …)
Route::get('/frontend-data', [FrontendDataController::class, 'show']);

// Contact form submission + public contact page data
Route::post('/contact', [ContactMessageController::class, 'store']);
Route::get('/pages/contact', [\App\Http\Controllers\PagesDashboardController::class, 'publicContactData']);
Route::get('/pages/about', [\App\Http\Controllers\PagesDashboardController::class, 'publicAboutData']);

// Auth
Route::prefix('auth')->group(function () {
    Route::post('/register',    [AuthController::class, 'register']);
    Route::post('/login',       [AuthController::class, 'login']);
    Route::post('/send-otp',    [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp',  [AuthController::class, 'verifyOtp']);
    Route::post('/logout',      [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me',           [AuthController::class, 'me'])->middleware('auth:sanctum');
    Route::patch('/me',         [AuthController::class, 'updateMe'])->middleware('auth:sanctum');
});

Route::prefix('orders')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
});

// Public products
Route::prefix('products')->group(function () {
    Route::get('/latest',        [ProductController::class, 'latest']);
    Route::get('/featured',      [ProductController::class, 'featured']);
    Route::get('/offer-targets', [ProductController::class, 'offerTargets']);
    Route::get('/search',        [ProductController::class, 'search']);
    Route::get('/{slug}',        [ProductController::class, 'show']);
    Route::get('/{slug}/related',[ProductController::class, 'related']);
});

// Public category products
Route::get('/categories/{slug}/products', [ProductController::class, 'byCategory']);
Route::get('/media/{path}', [MediaController::class, 'show'])->where('path', '.*');

/*
|--------------------------------------------------------------------------
| Admin routes (require Sanctum token with admin/staff role)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {

    // Frontend data write
    Route::put('/frontend-data', [FrontendDataController::class, 'update']);

    // Categories
    Route::get('/categories',         [AdminCategoryController::class, 'index']);
    Route::post('/categories',        [AdminCategoryController::class, 'store']);
    Route::patch('/categories/{id}',  [AdminCategoryController::class, 'update']);
    Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);

    // Products
    Route::get('/products/export',    [AdminProductController::class, 'export']);
    Route::post('/products/import',   [AdminProductController::class, 'import']);
    Route::get('/products',           [AdminProductController::class, 'index']);
    Route::post('/products',          [AdminProductController::class, 'store']);
    Route::get('/products/{id}',      [AdminProductController::class, 'show']);
    Route::patch('/products/{id}',    [AdminProductController::class, 'update']);
    Route::delete('/products/{id}',   [AdminProductController::class, 'destroy']);

    // Brands
    Route::get('/brands',         [AdminBrandController::class, 'index']);
    Route::post('/brands',        [AdminBrandController::class, 'store']);
    Route::patch('/brands/{id}',  [AdminBrandController::class, 'update']);
    Route::delete('/brands/{id}', [AdminBrandController::class, 'destroy']);

    // Units
    Route::get('/units',         [AdminUnitController::class, 'index']);
    Route::post('/units',        [AdminUnitController::class, 'store']);
    Route::patch('/units/{id}',  [AdminUnitController::class, 'update']);
    Route::delete('/units/{id}', [AdminUnitController::class, 'destroy']);

    // Attribute Sets
    Route::get('/attribute-sets',         [AdminAttributeSetController::class, 'index']);
    Route::post('/attribute-sets',        [AdminAttributeSetController::class, 'store']);
    Route::patch('/attribute-sets/{id}',  [AdminAttributeSetController::class, 'update']);
    Route::delete('/attribute-sets/{id}', [AdminAttributeSetController::class, 'destroy']);

    // Offers
    Route::get('/offers',                    [AdminOfferController::class, 'index']);
    Route::post('/offers',                   [AdminOfferController::class, 'store']);
    Route::put('/offers/{id}',               [AdminOfferController::class, 'update']);
    Route::patch('/offers/{id}/toggle',      [AdminOfferController::class, 'toggle']);
    Route::delete('/offers/{id}',            [AdminOfferController::class, 'destroy']);
    Route::get('/offers/product-search',     [AdminOfferController::class, 'productSearch']);
    Route::get('/offers/categories',         [AdminOfferController::class, 'categoryList']);

    // File upload (stores to public storage disk)
    Route::post('/upload', [AdminUploadController::class, 'store']);

    // Cloudinary signed upload (when Cloudinary is configured)
    Route::get('/cloudinary-signature', [CloudinaryController::class, 'signature']);
});
