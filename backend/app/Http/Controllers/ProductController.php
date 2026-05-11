<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductRelation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * GET /api/products/latest?offset=0&limit=10
     * Returns published products for the storefront "Latest" section.
     */
    public function latest(Request $request): JsonResponse
    {
        $offset = max(0, (int) $request->query('offset', 0));
        $limit  = min(20, max(1, (int) $request->query('limit', 10)));

        $total = Product::where('is_published', true)->count();

        $products = Product::where('is_published', true)
            ->with([
                'media'    => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order'),
                'variants' => fn ($q) => $q->where('is_active', true)->orderByDesc('is_default')->orderBy('sort_order'),
            ])
            ->orderByDesc('is_featured_home')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->skip($offset)
            ->take($limit)
            ->get();

        return response()->json([
            'products'   => $products->map(fn ($p) => $this->mapLatestProduct($p)),
            'nextOffset' => ($offset + $limit < $total) ? $offset + $limit : null,
            'total'      => $total,
        ]);
    }

    /**
     * GET /api/products/featured
     * Returns featured products for the sidebar.
     */
    public function featured(): JsonResponse
    {
        $products = Product::where('is_published', true)
            ->with([
                'media'    => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order'),
                'variants' => fn ($q) => $q->where('is_active', true)->orderByDesc('is_default')->orderBy('sort_order'),
            ])
            ->orderByDesc('is_featured_home')
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        $result = $products->filter(fn ($p) => $this->effectivePrice($p) > 0)
            ->map(fn ($p) => $this->mapFeaturedProduct($p))
            ->values();

        return response()->json(['products' => $result]);
    }

    /**
     * GET /api/products/offer-targets?slugs[]=slug1&slugs[]=slug2
     */
    public function offerTargets(Request $request): JsonResponse
    {
        $slugs = array_unique(array_filter((array) $request->query('slugs', [])));

        if (empty($slugs)) {
            return response()->json(['products' => []]);
        }

        $products = Product::whereIn('slug', $slugs)
            ->where('is_published', true)
            ->with(['media' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order')])
            ->get()
            ->keyBy('slug');

        $result = collect($slugs)->map(function ($slug) use ($products) {
            $p = $products->get($slug);
            if (! $p) {
                return null;
            }
            return [
                'id'               => $p->id,
                'slug'             => $p->slug,
                'title'            => $p->name,
                'image'            => $p->media->first()?->url ?? '',
                'shortDescription' => $this->stripHtml($p->short_description ?? $p->description ?? 'Product offer now available.'),
                'href'             => "/product/{$p->slug}",
            ];
        })->filter()->values();

        return response()->json(['products' => $result]);
    }

    /**
     * GET /api/products/{slug}
     * Public product page data.
     */
    public function show(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->where('is_published', true)
            ->with([
                'store',
                'category.parent',
                'media'    => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order'),
                'variants' => fn ($q) => $q->where('is_active', true)->orderByDesc('is_default')->orderBy('sort_order'),
                'specs'    => fn ($q) => $q->orderBy('sort_order'),
                'bullets'  => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->first();

        if (! $product) {
            return response()->json(['error' => 'Product not found.'], 404);
        }

        $hiddenSpecs = ['Tax Class', 'Low Stock Alert', 'Product Type', 'Visibility', 'Tags'];

        $specs = [];
        if ($product->brand) {
            $specs[] = ['label' => 'Brand', 'value' => $product->brand];
        }
        if ($product->category) {
            $specs[] = ['label' => 'Category', 'value' => $product->category->name];
        }
        foreach ($product->specs as $spec) {
            if (! in_array($spec->spec_name, $hiddenSpecs)) {
                $specs[] = ['label' => $spec->spec_name, 'value' => $spec->spec_value];
            }
        }

        $gallery = $product->media->map(fn ($m) => [
            'id'      => $m->id,
            'image'   => $m->url,
            'alt'     => $m->alt_text ?? $product->name,
            'isVideo' => $m->kind === 'video',
        ])->values()->all();

        $variants = $product->variants->map(fn ($v) => [
            'id'         => $v->id,
            'label'      => $v->option_value,
            'price'      => (float) $v->price,
            'priceLabel' => $this->formatMoney($product->currency_code, (float) $v->price),
            'oldPrice'   => $v->compare_at_price > 0 ? $this->formatMoney($product->currency_code, (float) $v->compare_at_price) : null,
            'stockQty'   => $v->stock_qty,
            'sku'        => $v->sku,
            'isDefault'  => (bool) $v->is_default,
        ])->values()->all();

        return response()->json([
            'product' => [
                'id'                 => $product->id,
                'categoryId'         => $product->category_id,
                'slug'               => $product->slug,
                'name'               => $product->name,
                'shortDescription'   => $product->short_description ?? '',
                'description'        => $product->description ?? '',
                'brand'              => $product->brand,
                'currencyCode'       => $product->currency_code,
                'storeName'          => $product->store->name,
                'storeLabel'         => 'Visit ' . $product->store->name,
                'rating'             => (float) $product->average_rating,
                'ratingsLabel'       => number_format($product->rating_count) . ' ratings',
                'bestsellerLabel'    => $product->bestseller_label,
                'bestsellerCategory' => $product->bestseller_category,
                'boughtLabel'        => $product->bought_past_month_label,
                'shippingLabel'      => $product->shipping_label ?? 'Shipping calculated at checkout.',
                'inStockLabel'       => $product->in_stock_label ?? 'In Stock',
                'deliveryLabel'      => $product->delivery_label ?? 'Delivery details available at checkout',
                'returnsLabel'       => $product->returns_label ?? '7-day refund / replacement',
                'paymentLabel'       => $product->payment_label ?? 'Secure transaction',
                'category'           => $product->category ? [
                    'name'   => $product->category->name,
                    'slug'   => $product->category->slug,
                    'parent' => $product->category->parent ? [
                        'name' => $product->category->parent->name,
                        'slug' => $product->category->parent->slug,
                    ] : null,
                ] : null,
                'gallery'      => $gallery,
                'variants'     => $variants,
                'specs'        => $specs,
                'aboutItems'   => $this->buildAboutItems($product),
            ],
        ]);
    }

    /**
     * GET /api/products/{slug}/related
     */
    public function related(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->where('is_published', true)->first();

        if (! $product) {
            return response()->json(['error' => 'Product not found.'], 404);
        }

        $limit = 8;

        $explicit = ProductRelation::where('product_id', $product->id)
            ->where('relation_kind', 'related')
            ->whereHas('relatedProduct', fn ($q) => $q->where('is_published', true))
            ->with(['relatedProduct.media', 'relatedProduct.variants'])
            ->orderBy('sort_order')
            ->take($limit)
            ->get();

        $related = $explicit->map(fn ($r) => $this->mapRelatedProduct($r->relatedProduct, $r->badge_text));
        $seen    = $related->pluck('id')->all();

        if ($related->count() < $limit) {
            $fallback = Product::where('id', '!=', $product->id)
                ->whereNotIn('id', $seen)
                ->where('is_published', true)
                ->when($product->category_id, fn ($q) => $q->where('category_id', $product->category_id))
                ->with(['media', 'variants'])
                ->orderByDesc('is_featured_home')
                ->orderByDesc('published_at')
                ->take($limit - $related->count())
                ->get();

            foreach ($fallback as $p) {
                $related->push($this->mapRelatedProduct($p));
            }
        }

        return response()->json(['products' => $related->take($limit)->values()]);
    }

    /**
     * GET /api/categories/{slug}/products
     */
    public function byCategory(Request $request, string $slug): JsonResponse
    {
        // ?tiles=1 — used by the home-page tile cards; skips price filter so
        // products without variants still appear as long as they have an image.
        $tilesMode = (bool) $request->query('tiles', false);

        $category = $this->resolveCategoryBySlug($slug);

        if ($category) {
            $category->load([
                'parent',
                'children' => function ($q) {
                    $q->where('is_active', true)->orderBy('featured_sort_order')->orderBy('name');
                },
            ]);
        }

        if (! $category) {
            return response()->json(['error' => 'Category not found.'], 404);
        }

        $mapProduct = function ($p) {
            $variant  = $p->variants->first();
            $media    = $p->media->first();
            $price    = $variant ? (float) $variant->price : (float) ($p->sale_price ?? $p->list_price ?? 0);
            $oldPrice = $variant?->compare_at_price ? (float) $variant->compare_at_price : (float) ($p->list_price ?? 0);

            return [
                'id'         => $p->id,
                'name'       => $p->name,
                'shortDesc'  => $this->stripHtml($p->short_description ?? $p->description ?? ''),
                'image'      => $media?->url ?? '',
                'price'      => $price,
                'oldPrice'   => $oldPrice > $price ? $oldPrice : null,
                'rating'     => (float) $p->average_rating,
                'isFeatured' => (bool) $p->is_featured_home,
                'href'       => "/product/{$p->slug}",
            ];
        };

        $directProducts = $this->productsForCategoryIds([$category->id])
            ->toBase()
            ->map($mapProduct)
            ->filter(fn ($p) => $tilesMode ? !empty($p['image']) : $p['price'] > 0)
            ->values();

        $subCategories = $category->children->map(function ($child) use ($mapProduct) {
            $products = $this->productsForCategoryIds($this->categoryTreeIds($child))
                ->toBase()
                ->map($mapProduct)
                ->filter(fn ($p) => $tilesMode ? !empty($p['image']) : $p['price'] > 0)
                ->values();

            return [
                'id'       => $child->id,
                'name'     => $child->name,
                'slug'     => $child->slug,
                'image'    => $child->image_url ?? '',
                'products' => $products,
            ];
        })->filter(fn ($c) => count($c['products']) > 0)->values();

        // Flat list of all products from this category and every descendant
        // category, including subcategories and sub-subcategories.
        $childProducts = $subCategories->flatMap(fn ($c) => $c['products']->toArray())->values();
        $allProducts   = $directProducts->merge($childProducts)->values();

        return response()->json([
            'categoryId'    => $category->id,
            'slug'          => $category->slug,
            'title'         => $category->name,
            'description'   => $category->description ?? "Browse our collection of {$category->name}.",
            'image'         => $category->image_url ?? '',
            'rootCategory'  => $category->parent?->name ?? '',
            'products'      => $allProducts,
            'subCategories' => $subCategories,
        ]);
    }

    // ─── helpers ──────────────────────────────────────────────

    private function resolveCategoryBySlug(string $slug): ?Category
    {
        $candidates = $this->categorySlugCandidates($slug);

        $category = Category::whereIn('slug', $candidates)->first();
        if ($category) {
            return $category;
        }

        $categories = Category::where('is_active', true)->get();
        foreach ($categories as $candidate) {
            if (in_array(Str::slug($candidate->name), $candidates, true)) {
                return $candidate;
            }
        }

        $normalized = Str::slug($slug);
        if (str_contains($normalized, 'appliance')) {
            return Category::where('is_active', true)
                ->where(function ($q) {
                    $q->where('slug', 'like', '%appliance%')
                        ->orWhere('name', 'like', '%appliance%');
                })
                ->orderByRaw('parent_id is not null')
                ->orderBy('featured_sort_order')
                ->orderBy('name')
                ->first();
        }

        if (str_contains($normalized, 'spare') || str_contains($normalized, 'parts') || str_contains($normalized, 'component')) {
            // Try to find a parent category that owns spare-parts sub-categories.
            // First, look for any category whose children include known sub-category names.
            $subNames = ['transistor', 'cable', 'arduino', 'microcontroller', 'computer accessor', 'batter', 'lab tool', 'electronic'];
            $childMatch = Category::where('is_active', true)
                ->whereNull('parent_id')
                ->whereHas('children', function ($q) use ($subNames) {
                    $q->where('is_active', true)
                        ->where(function ($inner) use ($subNames) {
                            foreach ($subNames as $name) {
                                $inner->orWhere('name', 'like', "%{$name}%");
                            }
                        });
                })
                ->first();
            if ($childMatch) return $childMatch;

            // Fall back to a category whose own name/slug mentions spare/parts/components.
            return Category::where('is_active', true)
                ->where(function ($q) {
                    $q->where('slug', 'like', '%spare%')
                        ->orWhere('slug', 'like', '%parts%')
                        ->orWhere('slug', 'like', '%component%')
                        ->orWhere('name', 'like', '%spare%')
                        ->orWhere('name', 'like', '%parts%')
                        ->orWhere('name', 'like', '%component%');
                })
                ->orderByRaw('parent_id is null desc')
                ->orderBy('featured_sort_order')
                ->orderBy('name')
                ->first();
        }

        return null;
    }

    private function categorySlugCandidates(string $slug): array
    {
        $normalized = Str::slug($slug);
        $candidates = array_filter([$slug, $normalized]);
        $segments = array_values(array_filter(explode('-', $normalized)));
        $lastSegment = array_pop($segments);

        if ($lastSegment) {
            foreach ([Str::singular($lastSegment), Str::plural($lastSegment)] as $variant) {
                $variantSegments = $segments;
                $variantSegments[] = $variant;
                $candidate = implode('-', $variantSegments);

                if ($candidate) {
                    $candidates[] = $candidate;
                }
            }
        }

        if (str_contains($normalized, 'appliance')) {
            $candidates = array_merge($candidates, [
                'large-appliance',
                'large-appliances',
                'home-appliance',
                'home-appliances',
                'appliance',
                'appliances',
            ]);
        }

        if (str_contains($normalized, 'spare') || str_contains($normalized, 'parts') || str_contains($normalized, 'component')) {
            $candidates = array_merge($candidates, [
                'spare-parts',
                'spare-part',
                'tv-spare-parts',
                'tv-parts',
                'components',
                'component',
                'electronics-components',
                'electronic-components',
            ]);
        }

        return array_values(array_unique(array_filter($candidates)));
    }

    private function productsForCategoryIds(array $categoryIds)
    {
        $ids = array_values(array_unique(array_filter($categoryIds)));

        if (empty($ids)) {
            return collect();
        }

        return Product::whereIn('category_id', $ids)
            ->where('is_published', true)
            ->with([
                'media'    => fn ($mq) => $mq->orderByDesc('is_primary')->orderBy('sort_order'),
                'variants' => fn ($vq) => $vq->where('is_active', true)->orderByDesc('is_default')->orderBy('sort_order'),
            ])
            ->orderByDesc('created_at')
            ->get();
    }

    private function categoryTreeIds(Category $category): array
    {
        $ids = [$category->id];
        $parentIds = [$category->id];

        while (! empty($parentIds)) {
            $children = Category::whereIn('parent_id', $parentIds)
                ->where('is_active', true)
                ->pluck('id')
                ->all();

            $children = array_values(array_diff($children, $ids));
            if (empty($children)) {
                break;
            }

            $ids = array_merge($ids, $children);
            $parentIds = $children;
        }

        return $ids;
    }

    private function effectivePrice(Product $p): float
    {
        $variant = $p->variants->first();
        if ($variant) {
            return (float) $variant->price;
        }
        return (float) ($p->sale_price ?? $p->list_price ?? 0);
    }

    private function formatMoney(string $currency, float $amount): string
    {
        return $currency . ' ' . number_format(round($amount));
    }

    private function stripHtml(?string $value): string
    {
        if (! $value) {
            return '';
        }
        $value = preg_replace('/<br\s*\/?>/i', "\n", $value);
        $value = preg_replace('/<\/p>/i', "\n", $value);
        $value = strip_tags($value);
        $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
        return trim(preg_replace('/\s+/', ' ', $value));
    }

    private function buildAboutItems(Product $p): array
    {
        $bullets = $p->bullets->map(fn ($b) => trim($b->bullet_text))->filter()->values()->all();

        if ($bullets) {
            return $bullets;
        }

        $text = implode('. ', array_filter([
            $this->stripHtml($p->short_description),
            $this->stripHtml($p->description),
        ]));

        return collect(preg_split('/\r?\n|[.]\s+/', $text))
            ->map(fn ($s) => trim($s))
            ->filter(fn ($s) => strlen($s) > 0)
            ->take(6)
            ->values()
            ->all();
    }

    private function mapLatestProduct(Product $p): array
    {
        $variant  = $p->variants->first();
        $media    = $p->media->first();
        $price    = $this->effectivePrice($p);
        $oldPrice = $variant?->compare_at_price ? (float) $variant->compare_at_price : (float) ($p->list_price ?? 0);
        $discount = ($oldPrice > $price && $oldPrice > 0) ? round((($oldPrice - $price) / $oldPrice) * 100) : null;

        return [
            'id'              => $p->id,
            'name'            => $p->name,
            'shortDesc'       => $this->stripHtml($p->short_description ?? $p->description ?? ''),
            'image'           => $media?->url ?? '',
            'price'           => $price,
            'oldPrice'        => $oldPrice > $price ? $oldPrice : null,
            'discountPercent' => $discount,
            'rating'          => (float) $p->average_rating,
            'href'            => "/product/{$p->slug}",
        ];
    }

    private function mapFeaturedProduct(Product $p): array
    {
        $price   = $this->effectivePrice($p);
        $variant = $p->variants->first();
        $media   = $p->media->first();
        [$whole, $decimal] = explode('.', number_format($price, 2, '.', ''));
        $listPrice = $variant?->compare_at_price ? (float) $variant->compare_at_price : (float) ($p->list_price ?? 0);

        return [
            'id'           => $p->id,
            'title'        => $p->name,
            'image'        => $media?->url ?? '',
            'href'         => "/product/{$p->slug}",
            'rating'       => max(0, min(5, round((float) $p->average_rating))),
            'reviews'      => $p->rating_count > 0 ? number_format($p->rating_count) : '0',
            'currencyCode' => $p->currency_code,
            'priceWhole'   => $whole,
            'priceDecimal' => $decimal,
            'extraPrice'   => $listPrice > $price ? 'Was ' . $this->formatMoney($p->currency_code, $listPrice) : null,
            'shipping'     => $p->shipping_label ?? 'Shipping calculated at checkout',
            'delivery'     => $p->delivery_label,
            'price'        => $price,
        ];
    }

    private function mapRelatedProduct(Product $p, ?string $badgeText = null): array
    {
        $variant   = $p->variants->first();
        $price     = $this->effectivePrice($p);
        $oldPrice  = $variant?->compare_at_price ? (float) $variant->compare_at_price : (float) ($p->list_price ?? 0);
        $media     = $p->media->first();

        return [
            'id'       => $p->id,
            'title'    => $p->name,
            'image'    => $media?->url ?? '',
            'href'     => "/product/{$p->slug}",
            'rating'   => (float) $p->average_rating,
            'reviews'  => $p->rating_count > 0 ? number_format($p->rating_count) : null,
            'price'    => $this->formatMoney($p->currency_code, $price),
            'oldPrice' => $oldPrice > $price ? $this->formatMoney($p->currency_code, $oldPrice) : null,
            'tag'      => $badgeText,
        ];
    }
}
