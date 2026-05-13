<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Offer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Profile;
use App\Models\Review;
use App\Models\SiteSettings;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Collection;

class OperationsDashboardController extends Controller
{
    public function inventory(): View
    {
        $variantCount = ProductVariant::count();
        $publishedProducts = Product::where('is_published', true)->count();
        $lowStockCount = ProductVariant::where('is_active', true)->where('stock_qty', '>', 0)->where('stock_qty', '<=', 5)->count();
        $outOfStockCount = ProductVariant::where('is_active', true)->where('stock_qty', '<=', 0)->count();

        $lowStockProducts = Product::with([
            'category',
            'variants' => fn ($query) => $query->where('is_active', true)->orderBy('stock_qty'),
        ])
            ->whereHas('variants', fn ($query) => $query->where('is_active', true)->where('stock_qty', '>', 0)->where('stock_qty', '<=', 5))
            ->latest()
            ->limit(10)
            ->get()
            ->map(function (Product $product) {
                $stock = (int) ($product->variants->min('stock_qty') ?? 0);

                return [
                    'title' => $product->name,
                    'meta' => $product->category?->name ?? 'Uncategorized',
                    'description' => $product->is_published ? 'Published on storefront' : 'Currently saved as draft',
                    'value' => $stock . ' left',
                    'badge' => [
                        'label' => $stock <= 2 ? 'Critical' : 'Low',
                        'tone' => $stock <= 2 ? 'red' : 'amber',
                    ],
                    'href' => route('dashboard.products.show', $product->id),
                ];
            });

        return $this->renderSection([
            'title' => 'Inventory',
            'eyebrow' => 'Catalog Operations',
            'description' => 'Monitor stock position, variant coverage, and products that need merchandising attention.',
            'actionLabel' => 'Manage products',
            'actionHref' => route('dashboard.products'),
            'cards' => [
                ['label' => 'Total SKUs', 'value' => number_format($variantCount), 'note' => 'All product variants currently stored in the catalog.'],
                ['label' => 'Published Products', 'value' => number_format($publishedProducts), 'note' => 'Products currently visible to shoppers.'],
                ['label' => 'Low-stock Variants', 'value' => number_format($lowStockCount), 'note' => 'Active variants at five units or fewer.'],
                ['label' => 'Out of Stock', 'value' => number_format($outOfStockCount), 'note' => 'Active variants that are unavailable right now.'],
            ],
            'listTitle' => 'Low-stock products',
            'listDescription' => 'These products are closest to running out and should be reviewed first.',
            'items' => $lowStockProducts,
            'emptyTitle' => 'Inventory looks healthy',
            'emptyBody' => 'No active products are currently below the low-stock threshold.',
            'sideTitle' => 'What this page tracks',
            'sideDescription' => 'This section uses live product and variant records only — no mocked inventory values.',
            'sideItems' => [
                'Variant totals come from the product_variants table.',
                'Low-stock checks are based on active variants with 1–5 units remaining.',
                'Use the product detail pages to restock, publish, or adjust merchandising flags.',
            ],
        ]);
    }

    public function returns(): View
    {
        $returnEnquiryQuery = ContactMessage::query()
            ->where(function ($query) {
                $query->where('subject', 'like', '%return%')
                    ->orWhere('subject', 'like', '%refund%')
                    ->orWhere('message', 'like', '%return%')
                    ->orWhere('message', 'like', '%refund%');
            });

        $returnEnquiryCount = (clone $returnEnquiryQuery)->count();

        $returnEnquiries = $returnEnquiryQuery
            ->latest()
            ->limit(10)
            ->get()
            ->map(function (ContactMessage $message) {
                return [
                    'title' => $message->subject ?: 'Return-related enquiry',
                    'meta' => $message->name . ' • ' . ($message->email ?: 'No email supplied'),
                    'description' => str($message->message)->limit(120)->toString(),
                    'value' => optional($message->created_at)?->diffForHumans() ?? '—',
                    'badge' => [
                        'label' => ucfirst($message->status ?: 'new'),
                        'tone' => $message->status === 'replied' ? 'green' : ($message->status === 'read' ? 'blue' : 'amber'),
                    ],
                    'href' => route('dashboard.messages'),
                ];
            });

        return $this->renderSection([
            'title' => 'Returns',
            'eyebrow' => 'Customer Care',
            'description' => 'There is no dedicated returns model yet, so this view surfaces return-related customer enquiries from the contact inbox.',
            'actionLabel' => 'Open messages',
            'actionHref' => route('dashboard.messages'),
            'cards' => [
                ['label' => 'Return Enquiries', 'value' => number_format($returnEnquiryCount), 'note' => 'Detected from message subjects and bodies.'],
                ['label' => 'Unread Messages', 'value' => number_format(ContactMessage::where('status', 'unread')->count()), 'note' => 'Messages still waiting for a first review.'],
                ['label' => 'Replied Messages', 'value' => number_format(ContactMessage::where('status', 'replied')->count()), 'note' => 'Customer requests that have already been answered.'],
                ['label' => 'Workflow Status', 'value' => 'Manual', 'note' => 'Returns are not yet tracked through a dedicated order workflow.'],
            ],
            'listTitle' => 'Return-related inbox items',
            'listDescription' => 'Use these messages as the current working queue until a proper returns module exists.',
            'items' => $returnEnquiries,
            'emptyTitle' => 'No return-related enquiries found',
            'emptyBody' => 'When customers ask about returns or refunds through the contact form, they will appear here.',
            'sideTitle' => 'Recommended next step',
            'sideDescription' => 'If returns become a regular workflow, move them into a dedicated model tied to orders.',
            'sideItems' => [
                'Keep customer-facing return policy details updated on the contact and about pages.',
                'Use message status changes to avoid losing track of pending replies.',
                'A future returns module should attach items, reasons, approval state, and refund state.',
            ],
        ]);
    }

    public function revenue(): View
    {
        return $this->renderSection([
            'title' => 'Revenue',
            'eyebrow' => 'Sales Intelligence',
            'description' => 'Order and payment tables are not part of this backend yet, so no real revenue totals can be calculated today.',
            'cards' => [
                ['label' => 'Gross Revenue', 'value' => '—', 'note' => 'Requires order totals and payment capture records.'],
                ['label' => 'Paid Orders', 'value' => '—', 'note' => 'No order ledger is currently available in the backend.'],
                ['label' => 'Average Order Value', 'value' => '—', 'note' => 'Will become available once completed orders exist.'],
                ['label' => 'Active Offers', 'value' => number_format(Offer::where('is_active', true)->count()), 'note' => 'Current promotions that could affect future revenue.'],
            ],
            'listTitle' => 'Revenue data prerequisites',
            'listDescription' => 'These are the areas already in place and the pieces still missing for a proper sales dashboard.',
            'items' => collect([
                ['title' => 'Products catalog', 'meta' => number_format(Product::count()) . ' products', 'description' => 'Catalog data is ready and can support order line items.', 'value' => 'Ready', 'badge' => ['label' => 'Ready', 'tone' => 'green'], 'href' => route('dashboard.products')],
                ['title' => 'Customers', 'meta' => number_format(Profile::where('role', 'customer')->count()) . ' accounts', 'description' => 'Customer records already exist for order ownership.', 'value' => 'Ready', 'badge' => ['label' => 'Ready', 'tone' => 'green'], 'href' => route('dashboard.customers')],
                ['title' => 'Offers', 'meta' => number_format(Offer::count()) . ' promotional rules', 'description' => 'Discount definitions are in place and can feed checkout logic.', 'value' => 'Ready', 'badge' => ['label' => 'Ready', 'tone' => 'green'], 'href' => route('dashboard.offers')],
                ['title' => 'Orders & payments', 'meta' => 'Not yet modeled', 'description' => 'This is the missing layer required for actual revenue analytics.', 'value' => 'Missing', 'badge' => ['label' => 'Missing', 'tone' => 'amber']],
            ]),
            'emptyTitle' => 'No revenue prerequisites available',
            'emptyBody' => 'Once products, customers, and orders exist together, this page can become a live sales dashboard.',
            'sideTitle' => 'Keep it honest',
            'sideDescription' => 'This page intentionally shows capability gaps instead of fake revenue charts.',
            'sideItems' => [
                'Add an orders table before introducing revenue widgets.',
                'Track payment status separately from fulfillment status.',
                'Store captured, refunded, and discounted totals for accurate reporting.',
            ],
        ]);
    }

    public function discounts(): View
    {
        $offers = Offer::latest()->limit(10)->get();

        return $this->renderSection([
            'title' => 'Discounts',
            'eyebrow' => 'Promotions',
            'description' => 'Review the current discount strategy and keep featured promotions aligned with the storefront.',
            'actionLabel' => 'Manage offers',
            'actionHref' => route('dashboard.offers'),
            'cards' => [
                ['label' => 'Active Offers', 'value' => number_format(Offer::where('is_active', true)->count()), 'note' => 'Offers available for storefront use right now.'],
                ['label' => 'Featured Offers', 'value' => number_format(Offer::where('is_featured', true)->count()), 'note' => 'Promotions marked for prominent placement.'],
                ['label' => 'Percentage Discounts', 'value' => number_format(Offer::where('type', 'percentage')->count()), 'note' => 'Rules using percentage-based reductions.'],
                ['label' => 'Fixed Discounts', 'value' => number_format(Offer::where('type', 'fixed')->count()), 'note' => 'Rules using fixed-value reductions.'],
            ],
            'listTitle' => 'Recent discounts',
            'listDescription' => 'The latest promotional rules currently configured in the backend.',
            'items' => $offers->map(fn (Offer $offer) => [
                'title' => $offer->name,
                'meta' => $offer->headline ?: strtoupper($offer->type),
                'description' => $offer->description ?: 'No offer description provided.',
                'value' => $offer->type === 'free_shipping' ? 'Free shipping' : number_format((float) $offer->value, 0),
                'badge' => [
                    'label' => $offer->is_active ? 'Active' : 'Inactive',
                    'tone' => $offer->is_active ? 'green' : 'slate',
                ],
                'href' => route('dashboard.offers'),
            ]),
            'emptyTitle' => 'No discounts configured',
            'emptyBody' => 'Create your first offer to start managing storefront discounts.',
            'sideTitle' => 'Offer hygiene',
            'sideDescription' => 'Simple promotional rules are easier for staff to maintain and easier for customers to understand.',
            'sideItems' => [
                'Keep only the most relevant featured offers active at one time.',
                'Use clear headlines and badge text for homepage promotions.',
                'Expire outdated discounts promptly to reduce admin clutter.',
            ],
        ]);
    }

    public function coupons(): View
    {
        $couponQuery = Offer::query()
            ->whereNotNull('code')
            ->where('code', '!=', '');

        $couponCount = (clone $couponQuery)->count();
        $activeCouponCount = (clone $couponQuery)->where('is_active', true)->count();
        $featuredCouponCount = (clone $couponQuery)->where('is_featured', true)->count();
        $couponUsageCount = (int) ((clone $couponQuery)->sum('usage_count'));

        $coupons = $couponQuery
            ->latest()
            ->limit(10)
            ->get();

        return $this->renderSection([
            'title' => 'Coupons',
            'eyebrow' => 'Promotions',
            'description' => 'Track code-based offers separately from broader storefront discounts.',
            'actionLabel' => 'Manage offers',
            'actionHref' => route('dashboard.offers'),
            'cards' => [
                ['label' => 'Coupon Offers', 'value' => number_format($couponCount), 'note' => 'Offers with a manually entered promo code.'],
                ['label' => 'Active Coupons', 'value' => number_format($activeCouponCount), 'note' => 'Codes currently enabled for use.'],
                ['label' => 'Featured Coupons', 'value' => number_format($featuredCouponCount), 'note' => 'Codes marked for storefront emphasis.'],
                ['label' => 'Redemptions Logged', 'value' => number_format($couponUsageCount), 'note' => 'Usage counts tracked against coupon records.'],
            ],
            'listTitle' => 'Coupon codes',
            'listDescription' => 'A quick view of the codes your staff can distribute or promote.',
            'items' => $coupons->map(fn (Offer $offer) => [
                'title' => $offer->code,
                'meta' => $offer->name,
                'description' => $offer->headline ?: 'Code-based promotion',
                'value' => 'Used ' . number_format((int) $offer->usage_count) . ' times',
                'badge' => [
                    'label' => $offer->is_active ? 'Active' : 'Inactive',
                    'tone' => $offer->is_active ? 'green' : 'slate',
                ],
                'href' => route('dashboard.offers'),
            ]),
            'emptyTitle' => 'No coupon codes yet',
            'emptyBody' => 'Add a code to an offer and it will appear here automatically.',
            'sideTitle' => 'Coupon usage tips',
            'sideDescription' => 'Code-based offers work best when they have clear start and expiry dates.',
            'sideItems' => [
                'Avoid duplicating the same code across multiple active offers.',
                'Use usage limits when a campaign should be tightly controlled.',
                'Retire old coupon codes to keep the list readable for staff.',
            ],
        ]);
    }

    public function transactions(): View
    {
        $gateways = collect($this->frontendData()['gateways'] ?? []);

        return $this->renderSection([
            'title' => 'Transactions',
            'eyebrow' => 'Payments',
            'description' => 'Transaction records are not stored in this backend yet, so this page focuses on payment readiness instead of fabricated payment history.',
            'cards' => [
                ['label' => 'Recorded Transactions', 'value' => '0', 'note' => 'No transaction ledger exists in the current schema.'],
                ['label' => 'Enabled Gateways', 'value' => number_format($gateways->where('enabled', true)->count()), 'note' => 'Payment methods currently enabled in storefront data.'],
                ['label' => 'Manual Payment Options', 'value' => number_format($gateways->filter(fn ($gateway) => str_contains(strtolower($gateway['name'] ?? ''), 'cash'))->count()), 'note' => 'Payment methods that do not require card capture.'],
                ['label' => 'Automation Status', 'value' => 'Pending', 'note' => 'Gateway callbacks and payment reconciliation are not yet implemented here.'],
            ],
            'listTitle' => 'Payment method readiness',
            'listDescription' => 'Live storefront gateway configuration pulled from site settings.',
            'items' => $gateways->map(fn (array $gateway) => [
                'title' => $gateway['name'] ?? 'Unnamed gateway',
                'meta' => $gateway['id'] ?? 'gateway',
                'description' => $gateway['description'] ?? 'No description provided.',
                'value' => !empty($gateway['enabled']) ? 'Enabled' : 'Disabled',
                'badge' => [
                    'label' => !empty($gateway['enabled']) ? 'Enabled' : 'Disabled',
                    'tone' => !empty($gateway['enabled']) ? 'green' : 'slate',
                ],
                'href' => route('dashboard.payments.gateways'),
            ]),
            'emptyTitle' => 'No gateway configuration found',
            'emptyBody' => 'Add or update payment gateways from storefront settings to see them here.',
            'sideTitle' => 'Before adding transaction analytics',
            'sideDescription' => 'A payment dashboard becomes useful only after every payment attempt is stored and categorized.',
            'sideItems' => [
                'Store gateway reference IDs for every checkout attempt.',
                'Track pending, succeeded, failed, and refunded states separately.',
                'Pair transaction data with future order records for reconciliation.',
            ],
        ]);
    }

    public function reports(): View
    {
        $reportItems = collect([
            ['title' => 'Catalog health', 'meta' => number_format(Product::count()) . ' products', 'description' => 'Published, featured, and low-stock product counts are available today.', 'value' => number_format(Product::where('is_published', true)->count()), 'badge' => ['label' => 'Live', 'tone' => 'green'], 'href' => url('/dashboard/inventory')],
            ['title' => 'Customer growth', 'meta' => number_format(Profile::where('role', 'customer')->count()) . ' customers', 'description' => 'Customer account growth can be measured from profile records.', 'value' => number_format(Profile::where('created_at', '>=', now()->startOfMonth())->where('role', 'customer')->count()), 'badge' => ['label' => 'This month', 'tone' => 'blue'], 'href' => route('dashboard.customers')],
            ['title' => 'Message volume', 'meta' => number_format(ContactMessage::count()) . ' messages', 'description' => 'Inbox metrics are available from contact form submissions.', 'value' => number_format(ContactMessage::where('status', 'unread')->count()), 'badge' => ['label' => 'Unread', 'tone' => 'amber'], 'href' => route('dashboard.messages')],
            ['title' => 'Promotions', 'meta' => number_format(Offer::count()) . ' offers', 'description' => 'Discount and coupon coverage is already measurable.', 'value' => number_format(Offer::where('is_active', true)->count()), 'badge' => ['label' => 'Active', 'tone' => 'green'], 'href' => route('dashboard.offers')],
            ['title' => 'Reviews', 'meta' => number_format(Review::count()) . ' reviews', 'description' => 'Customer review moderation is available from review records.', 'value' => number_format(Review::where('is_approved', false)->count()), 'badge' => ['label' => 'Pending', 'tone' => 'amber'], 'href' => route('dashboard.reviews')],
        ]);

        return $this->renderSection([
            'title' => 'Reports',
            'eyebrow' => 'Operational Snapshot',
            'description' => 'This reporting page summarizes the live operational data that already exists in the backend today.',
            'cards' => [
                ['label' => 'Products', 'value' => number_format(Product::count()), 'note' => 'All products stored in the catalog.'],
                ['label' => 'Customers', 'value' => number_format(Profile::where('role', 'customer')->count()), 'note' => 'Registered customer accounts.'],
                ['label' => 'Messages', 'value' => number_format(ContactMessage::count()), 'note' => 'All contact form submissions received.'],
                ['label' => 'Offers', 'value' => number_format(Offer::count()), 'note' => 'Configured promotions and discount rules.'],
            ],
            'listTitle' => 'Available report modules',
            'listDescription' => 'Each module below is driven by real records already available in the database.',
            'items' => $reportItems,
            'emptyTitle' => 'No report modules available',
            'emptyBody' => 'As more operational tables are added, they can be summarized here.',
            'sideTitle' => 'What is still missing',
            'sideDescription' => 'The major reporting gap is still order and payment history.',
            'sideItems' => [
                'Add order records to unlock sales, fulfillment, and revenue reporting.',
                'Track payment state transitions to support reconciliation reports.',
                'Store returns and refunds explicitly to report after-sales operations.',
            ],
        ]);
    }

    public function reviews(): View
    {
        $reviews = Review::with(['product:id,name', 'profile:id,full_name'])->latest()->limit(10)->get();
        $averageRating = round((float) Review::avg('rating'), 1);

        return $this->renderSection([
            'title' => 'Reviews',
            'eyebrow' => 'Storefront Feedback',
            'description' => 'Track customer reviews, moderation state, and the products attracting the most feedback.',
            'cards' => [
                ['label' => 'Total Reviews', 'value' => number_format(Review::count()), 'note' => 'All review records stored in the backend.'],
                ['label' => 'Approved', 'value' => number_format(Review::where('is_approved', true)->count()), 'note' => 'Reviews currently ready for storefront display.'],
                ['label' => 'Pending', 'value' => number_format(Review::where('is_approved', false)->count()), 'note' => 'Reviews waiting for moderation.'],
                ['label' => 'Average Rating', 'value' => $averageRating > 0 ? number_format($averageRating, 1) . '/5' : '—', 'note' => 'Average score across all submitted reviews.'],
            ],
            'listTitle' => 'Latest reviews',
            'listDescription' => 'Recent review submissions with moderation state and product context.',
            'items' => $reviews->map(fn (Review $review) => [
                'title' => $review->title ?: ($review->product?->name ?? 'Product review'),
                'meta' => ($review->profile?->full_name ?? 'Unknown customer') . ' • ' . ($review->product?->name ?? 'Unknown product'),
                'description' => str($review->body)->limit(120)->toString(),
                'value' => number_format((int) $review->rating) . '/5',
                'badge' => [
                    'label' => $review->is_approved ? 'Approved' : 'Pending',
                    'tone' => $review->is_approved ? 'green' : 'amber',
                ],
            ]),
            'emptyTitle' => 'No reviews yet',
            'emptyBody' => 'Customer product reviews will appear here as soon as they are submitted.',
            'sideTitle' => 'Moderation guidance',
            'sideDescription' => 'Keep review handling simple and consistent for staff.',
            'sideItems' => [
                'Approve only reviews that are product-specific and customer-safe.',
                'Use product detail pages to investigate any suspicious review quickly.',
                'Once storefront review display is live, keep pending reviews near zero.',
            ],
        ]);
    }

    public function fulfillment(): View
    {
        $allPickupLocations = collect($this->frontendData()['pickupLocations'] ?? []);
        $pickupLocations = $allPickupLocations->take(10);

        return $this->renderSection([
            'title' => 'Fulfillment',
            'eyebrow' => 'Operational Readiness',
            'description' => 'This backend does not track orders yet, so fulfillment readiness is summarized through pickup location and stock data instead of fake dispatch queues.',
            'actionLabel' => 'Pickup locations',
            'actionHref' => route('dashboard.shipping.pickup-locations'),
            'cards' => [
                ['label' => 'Pickup Locations', 'value' => number_format($allPickupLocations->count()), 'note' => 'Collection points currently stored in storefront settings.'],
                ['label' => 'Low-stock Products', 'value' => number_format(ProductVariant::where('is_active', true)->where('stock_qty', '>', 0)->where('stock_qty', '<=', 5)->count()), 'note' => 'Products that could affect fulfillment readiness soon.'],
                ['label' => 'Out-of-stock Variants', 'value' => number_format(ProductVariant::where('is_active', true)->where('stock_qty', '<=', 0)->count()), 'note' => 'Variants unavailable for future fulfillment.'],
                ['label' => 'Order Workflow', 'value' => 'Not live', 'note' => 'Dispatch tracking should begin once orders are modeled.'],
            ],
            'listTitle' => 'Pickup and collection points',
            'listDescription' => 'Locations currently available from the storefront configuration.',
            'items' => $pickupLocations->map(fn (array $location) => [
                'title' => $location['title'] ?? 'Pickup location',
                'meta' => trim(($location['city'] ?? '') . ' • ' . ($location['state'] ?? ''), ' •'),
                'description' => trim(($location['addressLine1'] ?? '') . ' ' . ($location['addressLine2'] ?? '')) ?: 'No address configured.',
                'value' => !empty($location['phone']) ? $location['phone'] : 'No phone',
                'badge' => [
                    'label' => !empty($location['isActive']) ? 'Active' : 'Inactive',
                    'tone' => !empty($location['isActive']) ? 'green' : 'slate',
                ],
                'href' => route('dashboard.shipping.pickup-locations'),
            ]),
            'emptyTitle' => 'No pickup locations configured',
            'emptyBody' => 'Add pickup locations in storefront data or the shipping section to improve operational readiness.',
            'sideTitle' => 'Future fulfillment needs',
            'sideDescription' => 'A fuller fulfillment module should coordinate stock, orders, pickup, and delivery state in one place.',
            'sideItems' => [
                'Connect future orders to pickup and delivery methods.',
                'Track packing, dispatch, delivery, and exception stages explicitly.',
                'Use inventory warnings to prevent overselling before dispatch tools go live.',
            ],
        ]);
    }

    public function generalSettings(): View
    {
        $settings = SiteSettings::query()->orderBy('key')->get();
        $frontend = $this->frontendData();
        $pages = $this->pagesData();

        return $this->renderSection([
            'title' => 'General Settings',
            'eyebrow' => 'Administrative',
            'description' => 'A compact overview of the site configuration already persisted in backend settings.',
            'cards' => [
                ['label' => 'Stored Setting Keys', 'value' => number_format($settings->count()), 'note' => 'Distinct configuration records in the site_settings table.'],
                ['label' => 'Top Navigation Links', 'value' => number_format(collect($frontend['navbar']['topLinks'] ?? [])->count()), 'note' => 'Customer-facing links in the main header.'],
                ['label' => 'Quick Links', 'value' => number_format(collect($frontend['navbar']['quickLinks'] ?? [])->count()), 'note' => 'Shortcut links shown in the storefront header.'],
                ['label' => 'Managed Pages', 'value' => number_format(collect($pages)->count()), 'note' => 'Pages currently managed through dashboard settings.'],
            ],
            'listTitle' => 'Configuration keys',
            'listDescription' => 'Live settings stored in the backend configuration table.',
            'items' => $settings->map(fn (SiteSettings $setting) => [
                'title' => $setting->key,
                'meta' => $setting->description ?: 'No description provided',
                'description' => str($setting->value)->limit(110)->toString(),
                'value' => 'Configured',
                'badge' => ['label' => 'Live', 'tone' => 'green'],
            ]),
            'emptyTitle' => 'No settings stored yet',
            'emptyBody' => 'Settings created by storefront and page editors will appear here.',
            'sideTitle' => 'Included today',
            'sideDescription' => 'This page focuses on what the backend already manages well.',
            'sideItems' => [
                'Storefront header and slider settings.',
                'About and contact page content.',
                'Serialized frontend configuration such as gateways and pickup locations.',
            ],
        ]);
    }

    public function staffAccounts(): View
    {
        $staff = Profile::query()->whereIn('role', ['admin', 'staff'])->latest()->limit(20)->get();

        return $this->renderSection([
            'title' => 'Staff Accounts',
            'eyebrow' => 'Administrative',
            'description' => 'Review staff and admin accounts that can access the dashboard.',
            'cards' => [
                ['label' => 'Admin Accounts', 'value' => number_format(Profile::where('role', 'admin')->count()), 'note' => 'Accounts with the highest current dashboard access.'],
                ['label' => 'Staff Accounts', 'value' => number_format(Profile::where('role', 'staff')->count()), 'note' => 'Operational accounts with staff-level access.'],
                ['label' => 'Total Access Accounts', 'value' => number_format(Profile::whereIn('role', ['admin', 'staff'])->count()), 'note' => 'Profiles able to reach dashboard routes.'],
                ['label' => 'Customer Accounts', 'value' => number_format(Profile::where('role', 'customer')->count()), 'note' => 'Customer profiles stored separately from staff.'],
            ],
            'listTitle' => 'Latest staff accounts',
            'listDescription' => 'Recent admin and staff profiles currently stored in the system.',
            'items' => $staff->map(fn (Profile $profile) => [
                'title' => $profile->full_name,
                'meta' => $profile->email ?: $profile->phone,
                'description' => $profile->phone ?: 'No phone number supplied.',
                'value' => optional($profile->created_at)?->diffForHumans() ?? '—',
                'badge' => [
                    'label' => ucfirst($profile->role),
                    'tone' => $profile->role === 'admin' ? 'blue' : 'slate',
                ],
            ]),
            'emptyTitle' => 'No staff accounts found',
            'emptyBody' => 'Create admin or staff profiles to manage dashboard access.',
            'sideTitle' => 'Access note',
            'sideDescription' => 'Dashboard middleware currently grants access to admin and staff roles only.',
            'sideItems' => [
                'Keep privileged accounts limited to essential operators.',
                'Use unique emails and phone numbers for accountability.',
                'Consider adding audit logs before increasing staff access widely.',
            ],
        ]);
    }

    public function rolesPermissions(): View
    {
        $roles = Profile::query()
            ->selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->orderBy('role')
            ->get();

        return $this->renderSection([
            'title' => 'Roles & Permissions',
            'eyebrow' => 'Administrative',
            'description' => 'Current role distribution based on the profiles stored in the backend.',
            'cards' => [
                ['label' => 'Distinct Roles', 'value' => number_format($roles->count()), 'note' => 'Role values currently present in the profiles table.'],
                ['label' => 'Admins', 'value' => number_format(Profile::where('role', 'admin')->count()), 'note' => 'Profiles with full administrative access.'],
                ['label' => 'Staff', 'value' => number_format(Profile::where('role', 'staff')->count()), 'note' => 'Profiles with staff dashboard access.'],
                ['label' => 'Customers', 'value' => number_format(Profile::where('role', 'customer')->count()), 'note' => 'Profiles used for storefront account activity.'],
            ],
            'listTitle' => 'Role distribution',
            'listDescription' => 'A simple view of how profile access is currently segmented.',
            'items' => $roles->map(fn ($row) => [
                'title' => ucfirst($row->role ?: 'Unknown'),
                'meta' => 'Role key: ' . ($row->role ?: 'null'),
                'description' => $row->role === 'admin' ? 'Can pass the admin middleware gate.' : ($row->role === 'staff' ? 'Also allowed through the admin middleware gate.' : 'No dashboard access by default.'),
                'value' => number_format((int) $row->total),
                'badge' => [
                    'label' => $row->role === 'admin' ? 'Privileged' : ($row->role === 'staff' ? 'Privileged' : 'Standard'),
                    'tone' => in_array($row->role, ['admin', 'staff']) ? 'blue' : 'slate',
                ],
            ]),
            'emptyTitle' => 'No roles found',
            'emptyBody' => 'Roles will appear once user profiles are created.',
            'sideTitle' => 'Current implementation',
            'sideDescription' => 'Permissions are still role-based rather than capability-based.',
            'sideItems' => [
                'Admin and staff roles share the same middleware gate today.',
                'Customers authenticate for storefront APIs but not dashboard routes.',
                'If finer permissions are needed, introduce a separate capabilities system.',
            ],
        ]);
    }

    public function activityLog(): View
    {
        $activity = $this->recentActivity()->take(12);

        return $this->renderSection([
            'title' => 'Activities Log',
            'eyebrow' => 'Administrative',
            'description' => 'This is a lightweight recent-activity feed built from created and updated records across key modules.',
            'cards' => [
                ['label' => 'Recent Product Events', 'value' => number_format(Product::where('created_at', '>=', now()->subDays(7))->count()), 'note' => 'Products created in the last seven days.'],
                ['label' => 'Recent Messages', 'value' => number_format(ContactMessage::where('created_at', '>=', now()->subDays(7))->count()), 'note' => 'Inbox items received in the last seven days.'],
                ['label' => 'Recent Customer Signups', 'value' => number_format(Profile::where('role', 'customer')->where('created_at', '>=', now()->subDays(7))->count()), 'note' => 'Customer profiles created in the last seven days.'],
                ['label' => 'Recent Offers', 'value' => number_format(Offer::where('created_at', '>=', now()->subDays(7))->count()), 'note' => 'Promotions created in the last seven days.'],
            ],
            'listTitle' => 'Recent platform activity',
            'listDescription' => 'A practical stopgap until a dedicated audit log is introduced.',
            'items' => $activity,
            'emptyTitle' => 'No recent activity found',
            'emptyBody' => 'As records are created and updated, the latest items will appear here.',
            'sideTitle' => 'Important limitation',
            'sideDescription' => 'This feed is not a true audit trail — it only reflects recent entity timestamps.',
            'sideItems' => [
                'Add actor-aware audit logs for sensitive admin actions.',
                'Record updates separately from creates when accountability matters.',
                'Use audit events before opening more settings to additional staff.',
            ],
        ]);
    }

    public function paymentGateways(): View
    {
        $gateways = collect($this->frontendData()['gateways'] ?? []);

        return $this->renderSection([
            'title' => 'Payment Gateways',
            'eyebrow' => 'Payments',
            'description' => 'Payment method configuration currently comes from the serialized storefront settings.',
            'cards' => [
                ['label' => 'Configured Gateways', 'value' => number_format($gateways->count()), 'note' => 'Payment methods stored in frontend configuration.'],
                ['label' => 'Enabled', 'value' => number_format($gateways->where('enabled', true)->count()), 'note' => 'Methods currently enabled for shoppers.'],
                ['label' => 'Disabled', 'value' => number_format($gateways->where('enabled', false)->count()), 'note' => 'Configured methods not currently exposed.'],
                ['label' => 'Manual Methods', 'value' => number_format($gateways->filter(fn ($gateway) => str_contains(strtolower($gateway['name'] ?? ''), 'cash'))->count()), 'note' => 'Methods that do not rely on direct card capture.'],
            ],
            'listTitle' => 'Configured payment methods',
            'listDescription' => 'This list reflects live storefront gateway settings.',
            'items' => $gateways->map(fn (array $gateway) => [
                'title' => $gateway['name'] ?? 'Unnamed gateway',
                'meta' => $gateway['id'] ?? 'gateway',
                'description' => $gateway['description'] ?? 'No description provided.',
                'value' => !empty($gateway['enabled']) ? 'Enabled' : 'Disabled',
                'badge' => [
                    'label' => !empty($gateway['enabled']) ? 'Enabled' : 'Disabled',
                    'tone' => !empty($gateway['enabled']) ? 'green' : 'slate',
                ],
            ]),
            'emptyTitle' => 'No payment gateways configured',
            'emptyBody' => 'Once gateways are stored in frontend settings, they will appear here automatically.',
            'sideTitle' => 'Current source',
            'sideDescription' => 'This page reflects what the storefront can present today, not a full gateway integration status matrix.',
            'sideItems' => [
                'Gateway configuration is currently stored inside frontend_data.',
                'Use consistent naming so staff can recognize methods quickly.',
                'A dedicated payments settings editor could replace manual JSON-backed config later.',
            ],
        ]);
    }

    public function bankDetails(): View
    {
        $details = collect(data_get($this->frontendData(), 'bankDetails', []));

        return $this->renderSection([
            'title' => 'Bank Details',
            'eyebrow' => 'Payments',
            'description' => 'No bank detail management module exists yet, so this page stays intentionally minimal and truthful.',
            'cards' => [
                ['label' => 'Configured Accounts', 'value' => number_format($details->count()), 'note' => 'Bank accounts currently stored in settings.'],
                ['label' => 'Manual Transfer Flow', 'value' => $details->isNotEmpty() ? 'Configured' : 'Not set', 'note' => 'Useful for offline transfers and reconciliation.'],
                ['label' => 'Cash on Delivery', 'value' => collect($this->frontendData()['gateways'] ?? [])->contains(fn ($gateway) => str_contains(strtolower($gateway['name'] ?? ''), 'cash') && !empty($gateway['enabled'])) ? 'Enabled' : 'Disabled', 'note' => 'Derived from configured gateway settings.'],
                ['label' => 'Next Step', 'value' => 'Add settings', 'note' => 'Persist bank account details in site settings when ready.'],
            ],
            'listTitle' => 'Stored bank details',
            'listDescription' => 'Any future bank account entries stored in settings can be surfaced here.',
            'items' => $details->map(fn (array $detail) => [
                'title' => $detail['bankName'] ?? 'Bank account',
                'meta' => $detail['accountName'] ?? 'Unnamed account',
                'description' => $detail['accountNumber'] ?? 'No account number provided.',
                'value' => $detail['branch'] ?? '—',
                'badge' => ['label' => 'Configured', 'tone' => 'green'],
            ]),
            'emptyTitle' => 'No bank details configured',
            'emptyBody' => 'When you are ready to support manual transfers, save bank details into settings and surface them here.',
            'sideTitle' => 'Suggested implementation',
            'sideDescription' => 'If you add this feature later, keep it structured and limited to the details staff really need.',
            'sideItems' => [
                'Store bank name, account name, account number, and branch separately.',
                'Avoid burying financial details inside unrelated frontend settings long-term.',
                'Pair bank details with transaction references once manual payments are supported.',
            ],
        ]);
    }

    private function renderSection(array $payload): View
    {
        return view('admin.sections.page', $payload);
    }

    private function frontendData(): array
    {
        $defaults = [
            'navbar' => [
                'topLinks' => [
                    ['label' => 'Home', 'href' => '/', 'icon' => 'home'],
                    ['label' => 'About Us', 'href' => '/about', 'icon' => 'info'],
                    ['label' => 'Contact', 'href' => '/contact', 'icon' => 'mail'],
                ],
                'quickLinks' => [
                    ['label' => 'TV Parts', 'href' => '/tv-parts'],
                    ['label' => 'Featured Category', 'href' => '/featured'],
                    ['label' => 'Hot Deals!', 'href' => '/wholesale'],
                    ['label' => 'Blog', 'href' => '/blog'],
                ],
            ],
            'gateways' => [
                ['id' => 'stripe', 'name' => 'Stripe', 'description' => 'Credit/Debit Cards', 'logo' => '', 'enabled' => true],
                ['id' => 'flutterwave', 'name' => 'Flutterwave', 'description' => 'African Payments', 'logo' => '', 'enabled' => true],
                ['id' => 'mtn-momo', 'name' => 'MTN MoMo', 'description' => 'Mobile Money', 'logo' => '', 'enabled' => true],
                ['id' => 'airtel-money', 'name' => 'Airtel Money', 'description' => 'Mobile Money', 'logo' => '', 'enabled' => true],
                ['id' => 'cash', 'name' => 'Cash on Delivery', 'description' => 'Pay when you receive', 'logo' => '', 'enabled' => true],
            ],
            'pickupLocations' => [
                ['id' => 'pickup-bombo-road', 'title' => 'Bombo Road', 'contactName' => 'Bombo Road Desk', 'phone' => '+256700000001', 'email' => 'bombo@modern-electronics.com', 'addressLine1' => 'Bombo Road', 'addressLine2' => '', 'country' => 'Uganda', 'state' => 'Central Region', 'city' => 'Kampala', 'postalCode' => '256', 'isActive' => true],
                ['id' => 'pickup-kampala-road', 'title' => 'Kampala Road', 'contactName' => 'Kampala Road Desk', 'phone' => '+256700000002', 'email' => 'kampalaroad@modern-electronics.com', 'addressLine1' => 'Kampala Road', 'addressLine2' => '', 'country' => 'Uganda', 'state' => 'Central Region', 'city' => 'Kampala', 'postalCode' => '256', 'isActive' => true],
                ['id' => 'pickup-lugogo-bypass', 'title' => 'Lugogo By pass', 'contactName' => 'Lugogo By pass Desk', 'phone' => '+256700000003', 'email' => 'lugogo@modern-electronics.com', 'addressLine1' => 'Lugogo By pass', 'addressLine2' => '', 'country' => 'Uganda', 'state' => 'Central Region', 'city' => 'Kampala', 'postalCode' => '256', 'isActive' => true],
            ],
            'bankDetails' => [],
        ];

        $row = SiteSettings::find('frontend_data');
        $stored = $row ? (json_decode($row->value, true) ?: []) : [];

        return array_replace_recursive($defaults, $stored);
    }

    private function pagesData(): array
    {
        $defaults = [
            'about' => [
                'hero_title' => 'About Modern Electronics',
                'hero_subtitle' => 'Your trusted destination for quality electronics and accessories.',
            ],
            'contact' => [
                'hero_title' => 'Get in Touch',
                'hero_subtitle' => 'We are here to help. Reach out to us through any of the channels below.',
            ],
        ];

        $row = SiteSettings::find('pages_content');
        $stored = $row ? (json_decode($row->value, true) ?: []) : [];

        return array_replace_recursive($defaults, $stored);
    }

    private function recentActivity(): Collection
    {
        $products = Product::latest()->limit(4)->get()->map(fn (Product $product) => [
            'title' => $product->name,
            'meta' => 'Product',
            'description' => ($product->is_published ? 'Published' : 'Draft') . ' product updated in the catalog.',
            'value' => optional($product->updated_at)?->diffForHumans() ?? '—',
            'badge' => ['label' => 'Catalog', 'tone' => 'blue'],
            'timestamp' => $product->updated_at,
            'href' => route('dashboard.products.show', $product->id),
        ]);

        $offers = Offer::latest()->limit(3)->get()->map(fn (Offer $offer) => [
            'title' => $offer->name,
            'meta' => 'Offer',
            'description' => ($offer->is_active ? 'Active' : 'Inactive') . ' promotion updated.',
            'value' => optional($offer->updated_at)?->diffForHumans() ?? '—',
            'badge' => ['label' => 'Promotion', 'tone' => 'green'],
            'timestamp' => $offer->updated_at,
            'href' => route('dashboard.offers'),
        ]);

        $messages = ContactMessage::latest()->limit(3)->get()->map(fn (ContactMessage $message) => [
            'title' => $message->subject ?: 'New contact message',
            'meta' => 'Message',
            'description' => 'From ' . $message->name,
            'value' => optional($message->created_at)?->diffForHumans() ?? '—',
            'badge' => ['label' => ucfirst($message->status ?: 'new'), 'tone' => $message->status === 'replied' ? 'green' : ($message->status === 'read' ? 'blue' : 'amber')],
            'timestamp' => $message->created_at,
            'href' => route('dashboard.messages'),
        ]);

        $profiles = Profile::latest()->limit(3)->get()->map(fn (Profile $profile) => [
            'title' => $profile->full_name,
            'meta' => 'Profile',
            'description' => ucfirst($profile->role) . ' account created or updated.',
            'value' => optional($profile->updated_at)?->diffForHumans() ?? '—',
            'badge' => ['label' => ucfirst($profile->role), 'tone' => $profile->role === 'customer' ? 'slate' : 'blue'],
            'timestamp' => $profile->updated_at,
        ]);

        return $products
            ->concat($offers)
            ->concat($messages)
            ->concat($profiles)
            ->sortByDesc('timestamp')
            ->values();
    }
}
