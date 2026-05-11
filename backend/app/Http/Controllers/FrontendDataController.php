<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Offer;
use App\Models\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FrontendDataController extends Controller
{
    private const KEY = 'frontend_data';

    private array $defaultData = [
        'navbar' => [
            'logoUrl'           => '',
            'logoAlt'           => '',
            'siteTitle'         => 'Modern Electronics',
            'faviconUrl'        => '/favicon.ico',
            'searchPlaceholder' => 'Search here...',
            'topLinks'          => [
                ['label' => 'Home',     'href' => '/',        'icon' => 'home'],
                ['label' => 'About Us', 'href' => '/about',   'icon' => 'info'],
                ['label' => 'Contact',  'href' => '/contact', 'icon' => 'mail'],
            ],
            'quickLinks' => [
                ['label' => 'TV Parts',          'href' => '/tv-parts'],
                ['label' => 'Featured Category', 'href' => '/featured'],
                ['label' => 'Hot Deals!',        'href' => '/wholesale'],
                ['label' => 'Blog',              'href' => '/blog'],
            ],
        ],
        'hero' => [
            'slides'    => [],
            'sideCards' => [],
        ],
        'trustBar' => [
            'items' => [
                ['icon' => 'wallet',  'title' => 'Secure Shopping', 'subtitle' => '100% Safe & Secure'],
                ['icon' => 'package', 'title' => 'Easy Support',    'subtitle' => 'Whatsapp & Call'],
                ['icon' => 'truck',   'title' => 'Fast Delivery',   'subtitle' => 'Fast delivery around Kampala'],
            ],
        ],
        'categoryTiles'    => ['cards' => []],
        'latestProducts'   => ['title' => 'Latest', 'ctaLabel' => 'View all', 'ctaHref' => '/products', 'products' => []],
        'relatedProducts'  => ['title' => 'Products related to this item', 'sponsoredLabel' => 'Sponsored', 'pageLabel' => 'Page 1 of 58', 'products' => []],
        'productDetails'   => [
            'title'             => '',
            'storeLabel'        => 'Visit Modern Electronics Ltd',
            'rating'            => 0,
            'ratingsLabel'      => '0 ratings',
            'bestsellerLabel'   => '',
            'bestsellerCategory'=> '',
            'boughtLabel'       => '',
            'priceMajor'        => '0',
            'priceMinor'        => ',000',
            'shippingLabel'     => '',
            'inStockLabel'      => 'In Stock',
            'deliveryLabel'     => '',
            'aboutTitle'        => 'About this item',
            'aboutItems'        => [],
            'gallery'           => [],
            'sizes'             => [],
            'specs'             => [],
        ],
        'brands'          => [],
        'categories'      => [],
        'gateways'        => [
            ['id' => 'stripe',       'name' => 'Stripe',           'description' => 'Credit/Debit Cards',  'logo' => '', 'enabled' => true],
            ['id' => 'flutterwave',  'name' => 'Flutterwave',      'description' => 'African Payments',    'logo' => '', 'enabled' => true],
            ['id' => 'mtn-momo',     'name' => 'MTN MoMo',         'description' => 'Mobile Money',        'logo' => '', 'enabled' => true],
            ['id' => 'airtel-money', 'name' => 'Airtel Money',     'description' => 'Mobile Money',        'logo' => '', 'enabled' => true],
            ['id' => 'cash',         'name' => 'Cash on Delivery',  'description' => 'Pay when you receive','logo' => '', 'enabled' => true],
        ],
        'pickupLocations' => [
            [
                'id' => 'pickup-bombo-road', 'title' => 'Bombo Road', 'contactName' => 'Bombo Road Desk',
                'phone' => '+256700000001', 'email' => 'bombo@modern-electronics.com',
                'addressLine1' => 'Bombo Road', 'addressLine2' => '',
                'country' => 'Uganda', 'state' => 'Central Region', 'city' => 'Kampala',
                'postalCode' => '256', 'isActive' => true,
            ],
            [
                'id' => 'pickup-kampala-road', 'title' => 'Kampala Road', 'contactName' => 'Kampala Road Desk',
                'phone' => '+256700000002', 'email' => 'kampalaroad@modern-electronics.com',
                'addressLine1' => 'Kampala Road', 'addressLine2' => '',
                'country' => 'Uganda', 'state' => 'Central Region', 'city' => 'Kampala',
                'postalCode' => '256', 'isActive' => true,
            ],
            [
                'id' => 'pickup-lugogo-bypass', 'title' => 'Lugogo By pass', 'contactName' => 'Lugogo By pass Desk',
                'phone' => '+256700000003', 'email' => 'lugogo@modern-electronics.com',
                'addressLine1' => 'Lugogo By pass', 'addressLine2' => '',
                'country' => 'Uganda', 'state' => 'Central Region', 'city' => 'Kampala',
                'postalCode' => '256', 'isActive' => true,
            ],
        ],
        'offers' => [],
    ];

    /**
     * GET /api/frontend-data
     */
    public function show(): JsonResponse
    {
        try {
            $row    = SiteSettings::find(self::KEY);
            $stored = $row ? (json_decode($row->value, true) ?? []) : [];
            $base   = $row ? array_replace_recursive($this->defaultData, $stored) : $this->defaultData;

            // Indexed arrays (gateways, pickupLocations) must be replaced wholesale,
            // not merged by index — array_replace_recursive would corrupt them.
            foreach (['gateways', 'pickupLocations'] as $key) {
                if (array_key_exists($key, $stored)) {
                    $base[$key] = $stored[$key];
                }
            }

            // Overlay live categories from the categories table
            $base['categories'] = $this->buildCategoryList($base);

            // Overlay live offers from the offers table
            $base['offers'] = $this->buildOfferList();

            return response()->json([
                'data'       => $base,
                'source'     => $row ? 'db' : 'default',
                'configured' => true,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'data'       => $this->defaultData,
                'source'     => 'default',
                'configured' => true,
                'error'      => 'Failed to read frontend data.',
            ]);
        }
    }

    /**
     * PUT /api/frontend-data  (admin write)
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $body    = $request->json()->all();
            $merged  = array_replace_recursive($this->defaultData, $body);

            SiteSettings::updateOrCreate(
                ['key' => self::KEY],
                [
                    'value'       => json_encode($merged),
                    'description' => 'Serialized storefront and admin-managed frontend content',
                ]
            );

            // Sync categories from the payload into the categories table
            if (! empty($merged['categories'])) {
                $this->syncCategories($merged['categories']);
            }

            $merged['categories'] = $this->buildCategoryList($merged);

            return response()->json(['data' => $merged, 'source' => 'db']);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['error' => 'Failed to write frontend data.'], 500);
        }
    }

    // ─── helpers ──────────────────────────────────────────────

    private function buildCategoryList(array $base): array
    {
        $rows = Category::with('parent')->orderBy('featured_sort_order')->get();

        if ($rows->isEmpty()) {
            return $base['categories'] ?? [];
        }

        $blobCats = collect($base['categories'] ?? []);

        return $rows->map(function (Category $cat) use ($blobCats) {
            $blob = $blobCats->firstWhere('id', $cat->id);

            return [
                'id'           => $cat->id,
                'title'        => $cat->name,
                'rootCategory' => $cat->parent?->name ?? '',
                'order'        => $cat->featured_sort_order,
                'commission'   => $blob['commission'] ?? '0%',
                'isFeatured'   => $cat->featured_on_home,
                'isActive'     => $cat->is_active,
                'thumbnail'    => $cat->image_url ?? '',
                'banner'       => $blob['banner'] ?? '',
                'icon'         => $cat->image_url ?? $blob['icon'] ?? '',
                'slug'         => $cat->slug,
            ];
        })->values()->all();
    }

    private function buildOfferList(): array
    {
        return Offer::with([
                'products:id,name,slug',
                'products.media' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order')->limit(1),
                'categories:id,name,slug',
            ])
            ->where('is_active', true)
            ->orderByDesc('is_featured')
            ->orderBy('created_at')
            ->get()
            ->map(function (Offer $o) {
                $firstProduct  = $o->products->first();
                $firstCategory = $o->categories->first();

                [$frontendTargetType, $targetValue, $targetImage, $targetTitle] = match ($o->target_type) {
                    'products'   => [
                        'product',
                        $firstProduct?->slug ?? '',
                        $firstProduct?->media->first()?->url ?? '',
                        $firstProduct?->name ?? '',
                    ],
                    'categories' => [
                        'category',
                        $firstCategory?->slug ?? '',
                        $firstCategory?->image_url ?? '',
                        $firstCategory?->name ?? '',
                    ],
                    default => ['storewide', '', '', ''],
                };

                return [
                    'id'           => $o->id,
                    'title'        => $o->name,
                    'code'         => $o->code ?? '',
                    'headline'     => $o->headline ?? $o->name,
                    'description'  => $o->description ?? '',
                    'discountType' => $o->type,
                    'discountValue'=> (float) $o->value,
                    'startDate'    => $o->starts_at?->format('Y-m-d') ?? '',
                    'endDate'      => $o->expires_at?->format('Y-m-d') ?? '',
                    'targetType'   => $frontendTargetType,
                    'targetValue'  => $targetValue,
                    'targetImage'  => $targetImage,
                    'targetTitle'  => $targetTitle,
                    'badgeText'    => $o->badge_text ?? '',
                    'bannerImage'  => $o->banner_image ?? '',
                    'isActive'     => (bool) $o->is_active,
                    'isFeatured'   => (bool) $o->is_featured,
                    'stackable'    => false,
                ];
            })
            ->values()
            ->all();
    }

    private function syncCategories(array $categories): void
    {
        $parentByTitle = collect($categories)->keyBy('title');
        $incomingIds   = collect($categories)->pluck('id')->filter()->all();

        // Delete removed categories
        $toDelete = Category::whereNotIn('id', $incomingIds)->pluck('id')->all();
        if ($toDelete) {
            \App\Models\Product::whereIn('category_id', $toDelete)->update(['category_id' => null]);
            Category::whereIn('parent_id', $toDelete)->update(['parent_id' => null]);
            Category::whereIn('id', $toDelete)->delete();
        }

        // Upsert all without parents first
        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['id' => $cat['id']],
                [
                    'name'                => $cat['title'],
                    'slug'                => $cat['slug'],
                    'image_url'           => $cat['thumbnail'] ?? null,
                    'is_active'           => $cat['isActive'] ?? true,
                    'featured_on_home'    => $cat['isFeatured'] ?? false,
                    'featured_sort_order' => $cat['order'] ?? 0,
                    'parent_id'           => null,
                ]
            );
        }

        // Second pass: attach parents
        foreach ($categories as $cat) {
            if (empty($cat['rootCategory'])) {
                continue;
            }
            $parent = $parentByTitle->get($cat['rootCategory']);
            if (! $parent) {
                continue;
            }
            Category::where('id', $cat['id'])->update(['parent_id' => $parent['id']]);
        }
    }
}
