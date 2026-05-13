<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>@yield('title', 'Dashboard') — Modern Electronics Admin</title>

    {{-- Amazon Ember — same font family used by the Next.js storefront --}}
    <style>
        @font-face {
            font-family: "Amazon Ember";
            src: url("{{ asset('fonts/AmazonEmber_Rg.ttf') }}") format("truetype");
            font-weight: 400; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: "Amazon Ember";
            src: url("{{ asset('fonts/Amazon-Ember-Medium.ttf') }}") format("truetype");
            font-weight: 500; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: "Amazon Ember";
            src: url("{{ asset('fonts/AmazonEmber_Bd.ttf') }}") format("truetype");
            font-weight: 700; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: "Amazon Ember Display";
            src: url("{{ asset('fonts/AmazonEmberDisplay_Rg.ttf') }}") format("truetype");
            font-weight: 400; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: "Amazon Ember Display";
            src: url("{{ asset('fonts/AmazonEmberDisplay_Bd.ttf') }}") format("truetype");
            font-weight: 700; font-style: normal; font-display: swap;
        }

        [x-cloak] { display: none !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        /* Smooth sidebar expand/collapse */
        .nav-children {
            overflow: hidden;
            transition: max-height .25s ease, opacity .2s ease;
        }
        .nav-children.closed { max-height: 0; opacity: 0; }
        .nav-children.open   { max-height: 800px; opacity: 1; }
    </style>

    {{-- Tailwind CSS v3 CDN --}}
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans:    ['"Amazon Ember"','Arial','Helvetica','sans-serif'],
                        display: ['"Amazon Ember Display"','"Amazon Ember"','Arial','Helvetica','sans-serif'],
                    },
                }
            }
        }
    </script>

    {{-- Alpine.js --}}
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    {{-- Lucide Icons --}}
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
</head>

<body class="bg-[#f8fbff] text-[#111827] font-sans antialiased"
      x-data="dashboardApp()" x-init="init()">
    @php
        $frontendBrand = [
            'logoUrl' => '',
            'logoAlt' => '',
            'siteTitle' => 'Modern Electronics',
        ];

        try {
            $frontendSettings = \App\Models\SiteSettings::find('frontend_data');
            $frontendPayload = $frontendSettings ? json_decode($frontendSettings->value, true) : [];
            $frontendNavbar = is_array($frontendPayload['navbar'] ?? null) ? $frontendPayload['navbar'] : [];
            $frontendBrand = array_replace($frontendBrand, $frontendNavbar);
        } catch (\Throwable $e) {
            report($e);
        }
    @endphp

    {{-- Mobile sidebar overlay --}}
    <div x-show="sidebarOpen"
         x-cloak
         @click="sidebarOpen = false"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100"
         x-transition:leave-end="opacity-0"
         class="fixed inset-0 z-20 bg-black/60 xl:hidden">
    </div>

    <div class="min-h-screen">

        {{-- ═══ SIDEBAR ═══ --}}
        <aside class="fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col border-r border-white/5 bg-[#111827] transition-transform duration-300 xl:translate-x-0"
               :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'">

            {{-- Logo / Brand --}}
            <div class="flex items-center gap-3 px-6 py-8">
                @if (!empty($frontendBrand['logoUrl']))
                    <img src="{{ $frontendBrand['logoUrl'] }}"
                         alt="{{ $frontendBrand['logoAlt'] ?: $frontendBrand['siteTitle'] }}"
                         class="h-12 w-auto max-w-full object-contain" />
                @else
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6c400] shadow-lg shadow-yellow-500/20">
                        <i data-lucide="shopping-cart" class="h-[18px] w-[18px] text-[#111827]"></i>
                    </div>
                    <div>
                        <div class="text-[16px] font-black uppercase tracking-tight text-white">Modern Electronics</div>
                        <div class="text-[11px] font-bold uppercase tracking-widest text-gray-500">Control Center</div>
                    </div>
                @endif
            </div>

            {{-- Navigation --}}
            <nav class="mt-8 flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">

                {{-- ECOMMERCE --}}
                <p class="px-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Ecommerce</p>
                <div class="mt-4 space-y-1">
                    {{-- Overview --}}
                    <a href="{{ route('dashboard') }}"
                       class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition
                              {{ request()->routeIs('dashboard') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium' }}">
                        <i data-lucide="layout-dashboard" class="h-[18px] w-[18px] shrink-0"></i>
                        <span>Overview</span>
                    </a>

                    {{-- Orders --}}
                    <a href="{{ route('dashboard.orders') }}"
                       class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition
                              {{ request()->routeIs('dashboard.orders*') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium' }}">
                        <i data-lucide="shopping-cart" class="h-[18px] w-[18px] shrink-0"></i>
                        <span>Orders</span>
                    </a>

                    {{-- Products (expandable) --}}
                    <div x-data="{ open: {{ request()->routeIs('dashboard.products*') ? 'true' : 'false' }} }">
                        <button @click="open = !open"
                                class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition
                                       {{ request()->routeIs('dashboard.products*') ? 'bg-[#114f8f]/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <span class="flex items-center gap-3">
                                <i data-lucide="package" class="h-[18px] w-[18px] shrink-0"></i>
                                <span>Products</span>
                            </span>
                            <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200"
                               :class="open ? 'rotate-180' : ''"></i>
                        </button>
                        <div x-show="open"
                             x-transition:enter="transition ease-out duration-200"
                             x-transition:enter-start="opacity-0 -translate-y-1"
                             x-transition:enter-end="opacity-100 translate-y-0"
                             x-transition:leave="transition ease-in duration-150"
                             x-transition:leave-start="opacity-100 translate-y-0"
                             x-transition:leave-end="opacity-0 -translate-y-1"
                             class="ml-9 mt-1 space-y-1 border-l border-gray-800 pl-4">
                            <a href="{{ route('dashboard.products') }}"
                               class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                      {{ request()->routeIs('dashboard.products') && !request()->routeIs('dashboard.products.*') ? 'text-white font-semibold' : 'text-gray-400' }}">All Products</a>
                            <a href="{{ route('dashboard.products.add') }}"
                               class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                      {{ request()->routeIs('dashboard.products.add') ? 'text-white font-semibold' : 'text-gray-400' }}">Add New Product</a>
                            <a href="{{ route('dashboard.products.brand') }}"
                               class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                      {{ request()->routeIs('dashboard.products.brand') || request()->routeIs('dashboard.products.brands') ? 'text-white font-semibold' : 'text-gray-400' }}">Brand</a>
                            <a href="{{ route('dashboard.products.categories') }}"
                               class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                      {{ request()->routeIs('dashboard.products.categories') ? 'text-white font-semibold' : 'text-gray-400' }}">Categories</a>
                            <a href="{{ route('dashboard.products.units') }}"
                               class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                      {{ request()->routeIs('dashboard.products.units') ? 'text-white font-semibold' : 'text-gray-400' }}">Units</a>
                            <a href="{{ route('dashboard.products.attribute-sets') }}"
                               class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                      {{ request()->routeIs('dashboard.products.attribute-sets') ? 'text-white font-semibold' : 'text-gray-400' }}">Attribute Sets</a>
                            <a href="{{ route('dashboard.products.import') }}"
                               class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                      {{ request()->routeIs('dashboard.products.import') ? 'text-white font-semibold' : 'text-gray-400' }}">Bulk Import</a>
                            <a href="{{ route('dashboard.products.export') }}"
                               class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                      {{ request()->routeIs('dashboard.products.export') ? 'text-white font-semibold' : 'text-gray-400' }}">Bulk Export</a>
                        </div>
                    </div>

                    {{-- Customers --}}
                    <a href="{{ route('dashboard.customers') }}"
                       class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition
                              {{ request()->routeIs('dashboard.customers') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium' }}">
                        <i data-lucide="users" class="h-[18px] w-[18px] shrink-0"></i>
                        <span>Customers</span>
                    </a>

                    {{-- Inventory --}}
                    <a href="{{ url('/dashboard/inventory') }}"
                       class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition
                              {{ request()->routeIs('dashboard.inventory') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium' }}">
                        <i data-lucide="warehouse" class="h-[18px] w-[18px] shrink-0"></i>
                        <span>Inventory</span>
                    </a>

                    {{-- Shipping (expandable) --}}
                    <div x-data="{ open: {{ request()->routeIs('dashboard.shipping.*') ? 'true' : 'false' }} }">
                        <button @click="open = !open"
                                class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition {{ request()->routeIs('dashboard.shipping.*') ? 'bg-[#114f8f]/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <span class="flex items-center gap-3">
                                <i data-lucide="truck" class="h-[18px] w-[18px] shrink-0"></i>
                                <span>Shipping</span>
                            </span>
                            <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200"
                               :class="open ? 'rotate-180' : ''"></i>
                        </button>
                        <div x-show="open"
                             x-transition:enter="transition ease-out duration-200"
                             x-transition:enter-start="opacity-0 -translate-y-1"
                             x-transition:enter-end="opacity-100 translate-y-0"
                             class="ml-9 mt-1 space-y-1 border-l border-gray-800 pl-4">
                            <a href="{{ route('dashboard.shipping.configuration') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.shipping.configuration') ? 'text-white font-semibold' : 'text-gray-400' }}">Configuration</a>
                            <a href="{{ route('dashboard.shipping.countries') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.shipping.countries') ? 'text-white font-semibold' : 'text-gray-400' }}">Available Countries</a>
                            <a href="{{ route('dashboard.shipping.states') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.shipping.states') ? 'text-white font-semibold' : 'text-gray-400' }}">Available States</a>
                            <a href="{{ route('dashboard.shipping.cities') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.shipping.cities') ? 'text-white font-semibold' : 'text-gray-400' }}">Available Cities</a>
                            <a href="{{ route('dashboard.shipping.pickup-locations') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.shipping.pickup-locations') ? 'text-white font-semibold' : 'text-gray-400' }}">Pickup Locations</a>
                        </div>
                    </div>

                    {{-- Returns --}}
                    <a href="{{ route('dashboard.returns') }}"
                       class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition
                              {{ request()->routeIs('dashboard.returns') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium' }}">
                        <i data-lucide="refresh-ccw" class="h-[18px] w-[18px] shrink-0"></i>
                        <span>Returns</span>
                    </a>
                </div>

                {{-- SALES & MARKETING --}}
                <div class="mt-8">
                    <p class="px-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Sales &amp; Marketing</p>
                    <div class="mt-4 space-y-1">
                        <a href="{{ route('dashboard.revenue') }}" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition {{ request()->routeIs('dashboard.revenue') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'font-medium text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <i data-lucide="dollar-sign" class="h-[18px] w-[18px] shrink-0"></i>
                            <span>Revenue</span>
                        </a>
                        <a href="{{ route('dashboard.discounts') }}" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition {{ request()->routeIs('dashboard.discounts') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'font-medium text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <i data-lucide="percent" class="h-[18px] w-[18px] shrink-0"></i>
                            <span>Discounts</span>
                        </a>
                        <a href="{{ route('dashboard.coupons') }}" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition {{ request()->routeIs('dashboard.coupons') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'font-medium text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <i data-lucide="tag" class="h-[18px] w-[18px] shrink-0"></i>
                            <span>Coupons</span>
                        </a>
                        <a href="{{ route('dashboard.transactions') }}" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition {{ request()->routeIs('dashboard.transactions') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'font-medium text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <i data-lucide="credit-card" class="h-[18px] w-[18px] shrink-0"></i>
                            <span>Transactions</span>
                        </a>
                        <a href="{{ route('dashboard.reports') }}" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition {{ request()->routeIs('dashboard.reports') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'font-medium text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <i data-lucide="bar-chart-3" class="h-[18px] w-[18px] shrink-0"></i>
                            <span>Reports</span>
                        </a>
                    </div>
                </div>

                {{-- STORE MANAGEMENT --}}
                <div class="mt-8">
                    <p class="px-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Store Management</p>
                    <div class="mt-4 space-y-1">

                        {{-- StoreFront (expandable) --}}
                        <div x-data="{ open: {{ request()->routeIs('dashboard.storefront.*') ? 'true' : 'false' }} }">
                            <button @click="open = !open"
                                    class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition {{ request()->routeIs('dashboard.storefront.*') ? 'bg-[#114f8f]/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white' }}">
                                <span class="flex items-center gap-3">
                                    <i data-lucide="store" class="h-[18px] w-[18px] shrink-0"></i>
                                    <span>StoreFront</span>
                                </span>
                                <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200"
                                   :class="open ? 'rotate-180' : ''"></i>
                            </button>
                            <div x-show="open"
                                 x-transition:enter="transition ease-out duration-200"
                                 x-transition:enter-start="opacity-0 -translate-y-1"
                                 x-transition:enter-end="opacity-100 translate-y-0"
                                 class="ml-9 mt-1 space-y-1 border-l border-gray-800 pl-4">
                                <a href="{{ route('dashboard.storefront.header') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.storefront.header') ? 'text-white font-semibold' : 'text-gray-400' }}">Header</a>
                                <a href="{{ route('dashboard.storefront.slider') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.storefront.slider') ? 'text-white font-semibold' : 'text-gray-400' }}">Slider</a>
                            </div>
                        </div>

                        <a href="{{ route('dashboard.reviews') }}" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition {{ request()->routeIs('dashboard.reviews') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'font-medium text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <i data-lucide="star" class="h-[18px] w-[18px] shrink-0"></i>
                            <span>Reviews</span>
                        </a>

                        {{-- Messages with live unread badge --}}
                        @php
                            try {
                                $unreadCount = \App\Models\ContactMessage::where('status', 'unread')->count();
                            } catch (\Throwable $e) {
                                $unreadCount = 0;
                            }
                        @endphp
                        <a href="{{ route('dashboard.messages') }}"
                           class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition
                                  {{ request()->routeIs('dashboard.messages*') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium' }}">
                            <span class="flex items-center gap-3">
                                <i data-lucide="message-square" class="h-[18px] w-[18px] shrink-0"></i>
                                <span>Messages</span>
                            </span>
                            @if ($unreadCount > 0)
                                <span class="rounded-full bg-[#f6c400] px-2.5 py-1 text-[11px] font-black text-[#111827]">{{ $unreadCount }}</span>
                            @endif
                        </a>

                        {{-- Pages (expandable) --}}
                        <div x-data="{ open: {{ request()->routeIs('dashboard.pages.*') ? 'true' : 'false' }} }">
                            <button @click="open = !open"
                                    class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition
                                           {{ request()->routeIs('dashboard.pages.*') ? 'bg-[#114f8f]/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white' }}">
                                <span class="flex items-center gap-3">
                                    <i data-lucide="file-text" class="h-[18px] w-[18px] shrink-0"></i>
                                    <span>Pages</span>
                                </span>
                                <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200"
                                   :class="open ? 'rotate-180' : ''"></i>
                            </button>
                            <div x-show="open"
                                 x-transition:enter="transition ease-out duration-200"
                                 x-transition:enter-start="opacity-0 -translate-y-1"
                                 x-transition:enter-end="opacity-100 translate-y-0"
                                 x-transition:leave="transition ease-in duration-150"
                                 x-transition:leave-start="opacity-100 translate-y-0"
                                 x-transition:leave-end="opacity-0 -translate-y-1"
                                 class="ml-9 mt-1 space-y-1 border-l border-gray-800 pl-4">
                                <a href="{{ route('dashboard.pages.about') }}"
                                   class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                          {{ request()->routeIs('dashboard.pages.about') ? 'text-white font-semibold' : 'text-gray-400' }}">About Us</a>
                                <a href="{{ route('dashboard.pages.contact') }}"
                                   class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white
                                          {{ request()->routeIs('dashboard.pages.contact') ? 'text-white font-semibold' : 'text-gray-400' }}">Contact</a>
                            </div>
                        </div>
                        <a href="{{ route('dashboard.fulfillment') }}" class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition {{ request()->routeIs('dashboard.fulfillment') ? 'bg-[#114f8f] text-white shadow-lg shadow-blue-900/20 font-semibold' : 'font-medium text-gray-400 hover:bg-white/5 hover:text-white' }}">
                            <span class="flex items-center gap-3">
                                <i data-lucide="boxes" class="h-[18px] w-[18px] shrink-0"></i>
                                <span>Fulfillment</span>
                            </span>
                            <i data-lucide="chevron-right" class="h-4 w-4 {{ request()->routeIs('dashboard.fulfillment') ? 'text-white' : 'text-gray-400' }}"></i>
                        </a>
                    </div>
                </div>

                {{-- ADMINISTRATIVE --}}
                <div class="mt-8">
                    <p class="px-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Administrative</p>
                    <div class="mt-4 space-y-1">

                        {{-- System Settings (expandable) --}}
                        <div x-data="{ open: {{ request()->routeIs('dashboard.settings.*') ? 'true' : 'false' }} }">
                            <button @click="open = !open"
                                    class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition {{ request()->routeIs('dashboard.settings.*') ? 'bg-[#114f8f]/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white' }}">
                                <span class="flex items-center gap-3">
                                    <i data-lucide="settings" class="h-[18px] w-[18px] shrink-0"></i>
                                    <span>System Settings</span>
                                </span>
                                <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200"
                                   :class="open ? 'rotate-180' : ''"></i>
                            </button>
                            <div x-show="open"
                                 x-transition:enter="transition ease-out duration-200"
                                 x-transition:enter-start="opacity-0 -translate-y-1"
                                 x-transition:enter-end="opacity-100 translate-y-0"
                                 class="ml-9 mt-1 space-y-1 border-l border-gray-800 pl-4">
                                <a href="{{ route('dashboard.settings.general') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.settings.general') ? 'text-white font-semibold' : 'text-gray-400' }}">General</a>
                                <a href="{{ route('dashboard.settings.staff') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.settings.staff') ? 'text-white font-semibold' : 'text-gray-400' }}">Staff Accounts</a>
                                <a href="{{ route('dashboard.settings.roles') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.settings.roles') ? 'text-white font-semibold' : 'text-gray-400' }}">Roles & Permissions</a>
                                <a href="{{ route('dashboard.settings.activities') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.settings.activities') ? 'text-white font-semibold' : 'text-gray-400' }}">Activities Log</a>
                            </div>
                        </div>

                        {{-- Payment Methods (expandable) --}}
                        <div x-data="{ open: {{ request()->routeIs('dashboard.payments.*') ? 'true' : 'false' }} }">
                            <button @click="open = !open"
                                    class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition {{ request()->routeIs('dashboard.payments.*') ? 'bg-[#114f8f]/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white' }}">
                                <span class="flex items-center gap-3">
                                    <i data-lucide="credit-card" class="h-[18px] w-[18px] shrink-0"></i>
                                    <span>Payment Methods</span>
                                </span>
                                <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200"
                                   :class="open ? 'rotate-180' : ''"></i>
                            </button>
                            <div x-show="open"
                                 x-transition:enter="transition ease-out duration-200"
                                 x-transition:enter-start="opacity-0 -translate-y-1"
                                 x-transition:enter-end="opacity-100 translate-y-0"
                                 class="ml-9 mt-1 space-y-1 border-l border-gray-800 pl-4">
                                <a href="{{ route('dashboard.payments.gateways') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.payments.gateways') ? 'text-white font-semibold' : 'text-gray-400' }}">Gateways</a>
                                <a href="{{ route('dashboard.payments.bank-details') }}" class="block rounded-lg px-3 py-2 text-[14px] transition hover:bg-white/5 hover:text-white {{ request()->routeIs('dashboard.payments.bank-details') ? 'text-white font-semibold' : 'text-gray-400' }}">Bank Details</a>
                            </div>
                        </div>

                    </div>
                </div>

            </nav>

            {{-- Sidebar user footer --}}
            <div class="border-t border-white/5 bg-black/20 px-6 py-5">
                <div class="flex items-center gap-3">
                    @if (session('admin_profile.avatar'))
                        <img src="{{ session('admin_profile.avatar') }}"
                             alt="{{ session('admin_profile.fullName', 'Admin') }}"
                             class="h-11 w-11 rounded-full object-cover ring-2 ring-[#f6c400]" />
                    @else
                        <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#114f8f] text-sm font-black uppercase text-white ring-2 ring-[#f6c400]">
                            {{ strtoupper(substr(session('admin_profile.fullName', 'Admin'), 0, 1)) }}
                        </div>
                    @endif
                    <div class="min-w-0 flex-1">
                        <div class="truncate text-[15px] font-bold text-white">
                            {{ session('admin_profile.fullName', 'Admin') }}
                        </div>
                        <div class="truncate text-[12px] font-medium capitalize text-gray-500">
                            {{ session('admin_profile.role', 'Admin') }} Account
                        </div>
                    </div>
                    <div x-data="{ open: false }" class="relative">
                        <button @click="open = !open"
                                class="text-gray-500 transition-colors hover:text-white">
                            <i data-lucide="more-vertical" class="h-[18px] w-[18px]"></i>
                        </button>
                        <div x-show="open"
                             @click.away="open = false"
                             x-cloak
                             x-transition
                             class="absolute bottom-8 right-0 z-50 w-44 rounded-xl border border-gray-700 bg-[#1e2a3a] py-1.5 shadow-xl">
                            <a href="{{ route('dashboard') }}"
                               class="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-300 transition hover:bg-white/5 hover:text-white">
                                <i data-lucide="layout-dashboard" class="h-4 w-4"></i>
                                Dashboard
                            </a>
                            <a href="{{ route('dashboard.account.profile') }}"
                               class="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-300 transition hover:bg-white/5 hover:text-white">
                                <i data-lucide="user" class="h-4 w-4"></i>
                                My Profile
                            </a>
                            <a href="{{ route('dashboard.account.settings') }}"
                               class="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-300 transition hover:bg-white/5 hover:text-white">
                                <i data-lucide="settings" class="h-4 w-4"></i>
                                Account Settings
                            </a>
                            <div class="my-1.5 border-t border-gray-700"></div>
                            <form method="POST" action="{{ route('web.logout') }}">
                                @csrf
                                <button type="submit"
                                        class="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-red-400 transition hover:bg-red-500/10 hover:text-red-300">
                                    <i data-lucide="log-out" class="h-4 w-4"></i>
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

        </aside>
        {{-- ═══ END SIDEBAR ═══ --}}


        {{-- ═══ MAIN CONTENT ═══ --}}
        <div class="flex min-h-screen flex-col xl:ml-[280px]">

            {{-- Topbar --}}
            <header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-md md:px-6 xl:px-8">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {{-- Left: hamburger + store selector + search --}}
                    <div class="flex min-w-0 items-center gap-4">
                        {{-- Hamburger (mobile only) --}}
                        <button @click="sidebarOpen = !sidebarOpen"
                                class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#111827] xl:hidden">
                            <i data-lucide="menu" class="h-[18px] w-[18px]"></i>
                        </button>

                        {{-- Store selector --}}
                        <div class="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-[14px] font-bold text-[#374151] md:flex">
                            <span class="text-gray-400">Store:</span>
                            <span class="text-[#114f8f]">Modern Electronics Ltd</span>
                            <i data-lucide="chevron-down" class="h-3.5 w-3.5 text-gray-400"></i>
                        </div>

                        {{-- Search --}}
                        <div class="flex min-w-[220px] max-w-[520px] flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition-all focus-within:border-[#114f8f] focus-within:ring-4 focus-within:ring-blue-50">
                            <i data-lucide="search" class="h-[18px] w-[18px] shrink-0 text-gray-400"></i>
                            <input type="text"
                                   placeholder="Search Dashboard..."
                                   class="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-gray-400" />
                        </div>
                    </div>

                    {{-- Right: actions + avatar --}}
                    <div class="flex flex-wrap items-center gap-3">
                        <a href="https://e-modern.ug/"
                           target="_blank"
                           class="hidden items-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[14px] font-bold text-[#111827] transition-all hover:bg-gray-50 md:inline-flex">
                            View Store
                        </a>
                        <a href="{{ route('dashboard.offers') }}"
                           class="hidden rounded-xl border border-yellow-200/20 bg-[#f6c400] px-5 py-2.5 text-[14px] font-black tracking-wide text-[#111827] shadow-lg shadow-yellow-500/10 transition-colors hover:bg-[#ffcf00] md:inline-flex">
                            Create Offer
                        </a>


                        <div x-data="{ open: false }"
                             @mouseenter="open = true"
                             @mouseleave="open = false"
                             class="relative">
                            <button type="button"
                                    class="relative flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-2.5 py-2 shadow-sm transition hover:border-gray-300"
                                    :class="open ? 'border-[#114f8f] ring-4 ring-blue-50' : ''">
                                @if (session('admin_profile.avatar'))
                                    <img src="{{ session('admin_profile.avatar') }}"
                                         alt="{{ session('admin_profile.fullName', 'Admin') }}"
                                         class="h-10 w-10 rounded-xl object-cover" />
                                @else
                                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#114f8f] text-sm font-black uppercase text-white">
                                        {{ strtoupper(substr(session('admin_profile.fullName', 'Admin'), 0, 1)) }}
                                    </div>
                                @endif
                                <div class="hidden text-left md:block">
                                    <div class="max-w-[140px] truncate text-[13px] font-black text-[#111827]">
                                        {{ session('admin_profile.fullName', 'Admin') }}
                                    </div>
                                    <div class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                                        {{ session('admin_profile.role', 'Admin') }}
                                    </div>
                                </div>
                                <div class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></div>
                            </button>

                            <div x-show="open"
                                 x-cloak
                                 x-transition
                                 class="absolute right-0 top-[calc(100%+12px)] z-50 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                                <div class="border-b border-gray-100 bg-[#f8fbff] px-5 py-4">
                                    <div class="text-[15px] font-black text-[#111827]">{{ session('admin_profile.fullName', 'Admin') }}</div>
                                    <div class="mt-1 text-[12px] font-semibold text-gray-500">{{ session('admin_profile.email', 'admin@e-modern.ug') }}</div>
                                </div>
                                <div class="p-2">
                                    <a href="{{ route('dashboard.account.profile') }}"
                                       class="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold text-[#111827] transition hover:bg-gray-50">
                                        <i data-lucide="user" class="h-4 w-4 text-[#114f8f]"></i>
                                        <span>My Profile</span>
                                    </a>
                                    <a href="{{ route('dashboard.account.settings') }}"
                                       class="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold text-[#111827] transition hover:bg-gray-50">
                                        <i data-lucide="settings" class="h-4 w-4 text-[#114f8f]"></i>
                                        <span>Account Settings</span>
                                    </a>
                                    <form method="POST" action="{{ route('web.logout') }}">
                                        @csrf
                                        <button type="submit"
                                                class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold text-red-500 transition hover:bg-red-50">
                                            <i data-lucide="log-out" class="h-4 w-4"></i>
                                            <span>Logout</span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {{-- Page content --}}
            <div class="flex-1 overflow-x-hidden px-4 py-8 md:px-6 xl:px-10">
                @yield('content')
            </div>

            {{-- Footer --}}
            <footer class="border-t border-gray-200 bg-white px-6 py-4">
                <div class="flex flex-col items-center justify-between gap-2 text-[13px] text-gray-400 sm:flex-row">
                    <span>Modern Electronics Ltd &copy; {{ date('Y') }} — All rights reserved.</span>
                    <span>Created by <span class="font-semibold text-[#114f8f]">Kenpro Media</span> &nbsp;·&nbsp; V1.6.6</span>
                </div>
            </footer>

        </div>
        {{-- ═══ END MAIN ═══ --}}

    </div>

    <script>
        function dashboardApp() {
            return {
                sidebarOpen: false,
                init() {
                    window.addEventListener('resize', () => {
                        if (window.innerWidth >= 1280) this.sidebarOpen = false;
                    });
                },
            };
        }

        // Global base URL — used by all pages so relative /api/ paths work regardless
        // of how the app is deployed on cPanel (subdomain, subdirectory, etc.)
        window.API_BASE = '{{ rtrim(url('/'), '/') }}';

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
        });

        /**
         * Shared file-upload helper.
         * Posts to POST /api/admin/upload and returns the stored URL.
         * @param {File} file
         * @param {string} token  Bearer token
         * @returns {Promise<string>} public URL
         */
        async function uploadFile(file, token) {
            const body = new FormData();
            body.append('file', file);
            const res = await fetch('{{ url('/api/admin/upload') }}', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body,
            });
            const text = await res.text();
            let json = {};
            try { json = JSON.parse(text); } catch { json = { error: text }; }
            if (!res.ok || !json.url) throw new Error(json.error || 'Upload failed.');
            return json.url;
        }
    </script>

    @stack('scripts')
</body>
</html>
