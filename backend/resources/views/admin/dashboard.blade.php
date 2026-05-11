@extends('admin.layout')

@section('title', 'Overview')

@section('content')
@php
    $messageBadge = static function (string $status): string {
        return match ($status) {
            'replied' => 'border-green-200 bg-green-50 text-green-700',
            'read' => 'border-blue-200 bg-blue-50 text-blue-700',
            default => 'border-amber-200 bg-amber-50 text-amber-700',
        };
    };
@endphp

<div class="space-y-6">
    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <a href="{{ url('/dashboard/orders') }}" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="flex items-start justify-between gap-3">
                <h3 class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Orders</h3>
                <span class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">{{ $pendingOrders }} pending</span>
            </div>
            <div class="mt-4 text-[38px] font-black tracking-tight text-gray-900">{{ number_format($totalOrders) }}</div>
            <p class="mt-2 text-sm text-gray-500">Orders submitted through storefront checkout.</p>
        </a>

        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <h3 class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Products</h3>
                <span class="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{{ $recentUploads->count() }} recent</span>
            </div>
            <div class="mt-4 text-[38px] font-black tracking-tight text-gray-900">{{ number_format($totalProducts) }}</div>
            <p class="mt-2 text-sm text-gray-500">All products currently stored in the catalog.</p>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <h3 class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Published</h3>
                <span class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700">{{ $draftCount }} drafts</span>
            </div>
            <div class="mt-4 text-[38px] font-black tracking-tight text-gray-900">{{ number_format($publishedCount) }}</div>
            <p class="mt-2 text-sm text-gray-500">Products currently visible to customers on the storefront.</p>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <h3 class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Featured</h3>
                <span class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">Homepage</span>
            </div>
            <div class="mt-4 text-[38px] font-black tracking-tight text-gray-900">{{ number_format($featuredCount) }}</div>
            <p class="mt-2 text-sm text-gray-500">Products marked for featured storefront placement.</p>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <h3 class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Needs Review</h3>
                <span class="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700">Action</span>
            </div>
            <div class="mt-4 text-[38px] font-black tracking-tight text-gray-900">{{ number_format($productsToReview) }}</div>
            <p class="mt-2 text-sm text-gray-500">Products missing images or usable pricing information.</p>
        </div>
    </section>

    <section class="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div class="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h2 class="text-[22px] font-black text-gray-900">Catalog by category</h2>
                    <p class="mt-1 text-sm text-gray-500">The categories currently carrying the most products.</p>
                </div>
                <a href="{{ url('/dashboard/products/categories') }}" class="text-[13px] font-semibold text-[#114f8f] hover:underline">Manage categories</a>
            </div>

            <div class="mt-6 space-y-4">
                @forelse($topCategories as $category)
                    <div>
                        <div class="mb-1.5 flex items-center justify-between gap-3">
                            <span class="text-[14px] font-semibold text-gray-900">{{ $category['name'] }}</span>
                            <span class="text-[13px] text-gray-500">{{ number_format($category['count']) }} products</span>
                        </div>
                        <div class="h-2.5 rounded-full bg-gray-100">
                            <div class="h-2.5 rounded-full bg-[#114f8f]" style="width: {{ $category['percent'] }}%"></div>
                        </div>
                    </div>
                @empty
                    <div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                        No categories with products yet.
                    </div>
                @endforelse
            </div>
        </div>

        <div class="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h2 class="text-[22px] font-black text-gray-900">Recent customers</h2>
                    <p class="mt-1 text-sm text-gray-500">Latest customer signups from the storefront.</p>
                </div>
                <a href="{{ url('/dashboard/customers') }}" class="text-[13px] font-semibold text-[#114f8f] hover:underline">View all</a>
            </div>

            <div class="mt-6 space-y-3">
                @forelse($recentCustomers as $customer)
                    <div class="rounded-2xl border border-gray-100 px-4 py-3">
                        <div class="text-[14px] font-bold text-gray-900">{{ $customer['name'] }}</div>
                        <div class="mt-1 text-[13px] text-gray-500">{{ $customer['email'] }}</div>
                        <div class="mt-2 text-[12px] font-medium text-gray-400">Joined {{ $customer['joined'] }}</div>
                    </div>
                @empty
                    <div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                        No customer accounts have been created yet.
                    </div>
                @endforelse
            </div>
        </div>
    </section>

    <section class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <div class="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-5">
                <div>
                    <h2 class="text-[20px] font-black text-gray-900">Recent uploads</h2>
                    <p class="mt-1 text-sm text-gray-500">Newest products added to the catalog.</p>
                </div>
                <a href="{{ url('/dashboard/products') }}" class="text-[13px] font-semibold text-[#114f8f] hover:underline">View all products</a>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[820px]">
                    <thead>
                        <tr class="bg-gray-50 text-left text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
                            <th class="px-6 py-3">Product</th>
                            <th class="px-6 py-3">Category</th>
                            <th class="px-6 py-3">Price</th>
                            <th class="px-6 py-3">Status</th>
                            <th class="px-6 py-3">Added</th>
                            <th class="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($recentUploads as $row)
                            <tr class="border-t border-gray-100">
                                <td class="px-6 py-4 text-[14px] font-semibold text-gray-900">{{ $row['name'] }}</td>
                                <td class="px-6 py-4 text-[14px] text-gray-600">{{ $row['category'] }}</td>
                                <td class="px-6 py-4 text-[14px] font-medium text-gray-900">{{ $row['price'] }}</td>
                                <td class="px-6 py-4">
                                    <span class="rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] {{ $row['status'] === 'Published' ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700' }}">
                                        {{ $row['status'] }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-[14px] text-gray-500">{{ $row['createdAt'] }}</td>
                                <td class="px-6 py-4 text-right">
                                    <a href="{{ url('/dashboard/products/' . $row['id']) }}" class="text-[13px] font-semibold text-[#114f8f] hover:underline">Open</a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="px-6 py-10 text-center text-sm text-gray-500">No uploaded products found yet.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <div class="grid gap-6">
            <div class="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-[20px] font-black text-gray-900">Low-stock products</h2>
                        <p class="mt-1 text-sm text-gray-500">Products that need attention first.</p>
                    </div>
                    <a href="{{ url('/dashboard/inventory') }}" class="text-[13px] font-semibold text-[#114f8f] hover:underline">Open inventory</a>
                </div>

                <div class="mt-6 space-y-3">
                    @forelse($lowStockProducts as $item)
                        <div class="rounded-2xl border border-gray-100 px-4 py-3">
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <div class="text-[14px] font-bold text-gray-900">{{ $item['name'] }}</div>
                                    <div class="mt-1 text-[12px] text-gray-500">{{ $item['category'] }}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-[14px] font-bold text-gray-900">{{ $item['stock'] }} left</div>
                                    <span class="mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] {{ $item['status'] === 'Critical' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700' }}">
                                        {{ $item['status'] }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    @empty
                        <div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                            No low-stock products right now.
                        </div>
                    @endforelse
                </div>
            </div>

            <div class="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-[20px] font-black text-gray-900">Latest messages</h2>
                        <p class="mt-1 text-sm text-gray-500">Newest customer enquiries from the contact form.</p>
                    </div>
                    <a href="{{ url('/dashboard/messages') }}" class="text-[13px] font-semibold text-[#114f8f] hover:underline">Inbox</a>
                </div>

                <div class="mt-6 space-y-3">
                    @forelse($recentMessages as $message)
                        <div class="rounded-2xl border border-gray-100 px-4 py-3">
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <div class="text-[14px] font-bold text-gray-900">{{ $message['subject'] }}</div>
                                    <div class="mt-1 text-[13px] text-gray-500">{{ $message['name'] }}</div>
                                    <div class="mt-2 text-[12px] text-gray-400">{{ $message['received'] }}</div>
                                </div>
                                <span class="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] {{ $messageBadge($message['status']) }}">
                                    {{ ucfirst($message['status']) }}
                                </span>
                            </div>
                        </div>
                    @empty
                        <div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                            No customer messages yet.
                        </div>
                    @endforelse
                </div>
            </div>
        </div>
    </section>

    <section class="grid grid-cols-1 gap-6 md:grid-cols-4">
        <a href="{{ url('/dashboard/customers') }}" class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">New Customers</div>
            <div class="mt-3 text-[30px] font-black tracking-tight text-gray-900">{{ number_format($newCustomersThisMonth) }}</div>
            <p class="mt-2 text-sm text-gray-500">Customer accounts created this month.</p>
        </a>

        <a href="{{ url('/dashboard/messages') }}" class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Unread Messages</div>
            <div class="mt-3 text-[30px] font-black tracking-tight text-gray-900">{{ number_format($unreadMessagesCount) }}</div>
            <p class="mt-2 text-sm text-gray-500">Inbox items still waiting for a response.</p>
        </a>

        <a href="{{ url('/dashboard/offers') }}" class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Active Offers</div>
            <div class="mt-3 text-[30px] font-black tracking-tight text-gray-900">{{ number_format($activeOffersCount) }}</div>
            <p class="mt-2 text-sm text-gray-500">Promotions currently enabled for storefront use.</p>
        </a>

        <a href="{{ url('/dashboard/reviews') }}" class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Pending Reviews</div>
            <div class="mt-3 text-[30px] font-black tracking-tight text-gray-900">{{ number_format($pendingReviewsCount) }}</div>
            <p class="mt-2 text-sm text-gray-500">Customer reviews waiting for moderation.</p>
        </a>
    </section>
</div>
@endsection
