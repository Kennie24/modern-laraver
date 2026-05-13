<?php

use App\Http\Controllers\AttributeSetsDashboardController;
use App\Http\Controllers\BrandsDashboardController;
use App\Http\Controllers\CategoriesDashboardController;
use App\Http\Controllers\CustomersDashboardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportDashboardController;
use App\Http\Controllers\ImportDashboardController;
use App\Http\Controllers\MessagesDashboardController;
use App\Http\Controllers\OffersDashboardController;
use App\Http\Controllers\OperationsDashboardController;
use App\Http\Controllers\OrdersDashboardController;
use App\Http\Controllers\PagesDashboardController;
use App\Http\Controllers\ProfileDashboardController;
use App\Http\Controllers\ProductsDashboardController;
use App\Http\Controllers\ShippingDashboardController;
use App\Http\Controllers\StorefrontDashboardController;
use App\Http\Controllers\UnitsDashboardController;
use App\Http\Controllers\WebAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('web.login.page');
});

// /admin and /admin/* are common entry points — redirect to login (or dashboard if already signed in)
Route::get('/admin', [WebAuthController::class, 'showLogin']);
Route::get('/admin/{any}', function () {
    return redirect()->route('web.login.page');
})->where('any', '.*');

Route::get('/login', [WebAuthController::class, 'showLogin'])->name('web.login.page');
Route::post('/auth/login', [WebAuthController::class, 'login'])->name('web.login');
Route::post('/auth/register', [WebAuthController::class, 'register'])->name('web.register');
Route::post('/auth/logout', [WebAuthController::class, 'logout'])->name('web.logout');

Route::middleware('web.dashboard')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/account/profile', [ProfileDashboardController::class, 'show'])->name('dashboard.account.profile');
    Route::patch('/dashboard/account/profile', [ProfileDashboardController::class, 'update'])->name('dashboard.account.profile.update');
    Route::get('/dashboard/account/settings', [ProfileDashboardController::class, 'settings'])->name('dashboard.account.settings');
    Route::patch('/dashboard/account/settings/password', [ProfileDashboardController::class, 'updatePassword'])->name('dashboard.account.settings.password');

    Route::get('/dashboard/orders', [OrdersDashboardController::class, 'index'])->name('dashboard.orders');
    Route::patch('/dashboard/orders/{id}/status', [OrdersDashboardController::class, 'updateStatus'])->name('dashboard.orders.status');
    Route::patch('/dashboard/orders/{id}', [OrdersDashboardController::class, 'update'])->name('dashboard.orders.update');
    Route::delete('/dashboard/orders/{id}', [OrdersDashboardController::class, 'destroy'])->name('dashboard.orders.destroy');
    Route::get('/dashboard/orders/{id}', [OrdersDashboardController::class, 'show'])->name('dashboard.orders.show');

    Route::get('/dashboard/shipping/configuration', [ShippingDashboardController::class, 'configuration'])->name('dashboard.shipping.configuration');
    Route::get('/dashboard/shipping/countries', [ShippingDashboardController::class, 'countries'])->name('dashboard.shipping.countries');
    Route::get('/dashboard/shipping/states', [ShippingDashboardController::class, 'states'])->name('dashboard.shipping.states');
    Route::get('/dashboard/shipping/cities', [ShippingDashboardController::class, 'cities'])->name('dashboard.shipping.cities');
    Route::get('/dashboard/shipping/pickup-locations', [ShippingDashboardController::class, 'pickupLocations'])->name('dashboard.shipping.pickup-locations');

    Route::get('/dashboard/storefront/header', [StorefrontDashboardController::class, 'header'])->name('dashboard.storefront.header');
    Route::patch('/dashboard/storefront/header', [StorefrontDashboardController::class, 'updateHeader'])->name('dashboard.storefront.header.update');
    Route::get('/dashboard/storefront/slider', [StorefrontDashboardController::class, 'slider'])->name('dashboard.storefront.slider');
    Route::patch('/dashboard/storefront/slider', [StorefrontDashboardController::class, 'updateSlider'])->name('dashboard.storefront.slider.update');

    Route::get('/dashboard/products', [ProductsDashboardController::class, 'index'])->name('dashboard.products');
    Route::get('/dashboard/products/add', [ProductsDashboardController::class, 'add'])->name('dashboard.products.add');
    Route::get('/dashboard/products/brand', [BrandsDashboardController::class, 'index'])->name('dashboard.products.brand');
    Route::get('/dashboard/products/brands', [BrandsDashboardController::class, 'index'])->name('dashboard.products.brands');
    Route::get('/dashboard/products/categories', [CategoriesDashboardController::class, 'index'])->name('dashboard.products.categories');
    Route::get('/dashboard/products/units', [UnitsDashboardController::class, 'index'])->name('dashboard.products.units');
    Route::get('/dashboard/products/attribute-sets', [AttributeSetsDashboardController::class, 'index'])->name('dashboard.products.attribute-sets');
    Route::get('/dashboard/products/import', [ImportDashboardController::class, 'index'])->name('dashboard.products.import');
    Route::get('/dashboard/products/export', [ExportDashboardController::class, 'index'])->name('dashboard.products.export');
    Route::get('/dashboard/products/{id}', [ProductsDashboardController::class, 'show'])->name('dashboard.products.show');

    Route::get('/dashboard/offers', [OffersDashboardController::class, 'index'])->name('dashboard.offers');

    Route::get('/dashboard/inventory', [OperationsDashboardController::class, 'inventory'])->name('dashboard.inventory');
    Route::get('/dashboard/returns', [OperationsDashboardController::class, 'returns'])->name('dashboard.returns');
    Route::get('/dashboard/revenue', [OperationsDashboardController::class, 'revenue'])->name('dashboard.revenue');
    Route::get('/dashboard/discounts', [OperationsDashboardController::class, 'discounts'])->name('dashboard.discounts');
    Route::get('/dashboard/coupons', [OperationsDashboardController::class, 'coupons'])->name('dashboard.coupons');
    Route::get('/dashboard/transactions', [OperationsDashboardController::class, 'transactions'])->name('dashboard.transactions');
    Route::get('/dashboard/reports', [OperationsDashboardController::class, 'reports'])->name('dashboard.reports');
    Route::get('/dashboard/reviews', [OperationsDashboardController::class, 'reviews'])->name('dashboard.reviews');
    Route::get('/dashboard/fulfillment', [OperationsDashboardController::class, 'fulfillment'])->name('dashboard.fulfillment');

    Route::get('/dashboard/settings/general', [OperationsDashboardController::class, 'generalSettings'])->name('dashboard.settings.general');
    Route::get('/dashboard/settings/staff-accounts', [OperationsDashboardController::class, 'staffAccounts'])->name('dashboard.settings.staff');
    Route::get('/dashboard/settings/roles-permissions', [OperationsDashboardController::class, 'rolesPermissions'])->name('dashboard.settings.roles');
    Route::get('/dashboard/settings/activities-log', [OperationsDashboardController::class, 'activityLog'])->name('dashboard.settings.activities');

    Route::get('/dashboard/payments/gateways', [OperationsDashboardController::class, 'paymentGateways'])->name('dashboard.payments.gateways');
    Route::get('/dashboard/payments/bank-details', [OperationsDashboardController::class, 'bankDetails'])->name('dashboard.payments.bank-details');

    // Customers
    Route::get('/dashboard/customers', [CustomersDashboardController::class, 'index'])->name('dashboard.customers');

    // Messages
    Route::get('/dashboard/messages', [MessagesDashboardController::class, 'index'])->name('dashboard.messages');
    Route::patch('/dashboard/messages/{id}/read', [MessagesDashboardController::class, 'markRead'])->name('dashboard.messages.read');
    Route::patch('/dashboard/messages/{id}/status', [MessagesDashboardController::class, 'updateStatus'])->name('dashboard.messages.status');

    // Pages
    Route::get('/dashboard/pages/about', [PagesDashboardController::class, 'about'])->name('dashboard.pages.about');
    Route::patch('/dashboard/pages/about', [PagesDashboardController::class, 'updateAbout'])->name('dashboard.pages.about.update');
    Route::get('/dashboard/pages/contact', [PagesDashboardController::class, 'contact'])->name('dashboard.pages.contact');
    Route::patch('/dashboard/pages/contact', [PagesDashboardController::class, 'updateContact'])->name('dashboard.pages.contact.update');
});
