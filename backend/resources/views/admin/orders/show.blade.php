@extends('admin.layout')

@section('title', 'Order ' . $order->order_number)

@section('content')
@php
    $metadata = is_array($order->metadata) ? $order->metadata : [];
    $history = collect($metadata['statusHistory'] ?? [])->reverse()->values();
    $statusTone = static function (?string $status): string {
        return match ($status) {
            'confirmed', 'approved' => 'border-sky-200 bg-sky-50 text-sky-700',
            'processing', 'ready', 'shipped' => 'border-blue-200 bg-blue-50 text-blue-700',
            'delivered' => 'border-green-200 bg-green-50 text-green-700',
            'cancelled', 'failed', 'refunded' => 'border-red-200 bg-red-50 text-red-700',
            default => 'border-amber-200 bg-amber-50 text-amber-700',
        };
    };
@endphp

<div class="-mx-4 -mt-4 min-h-screen bg-[#f7f7f8] px-4 pt-6 pb-16 sm:-mx-6 sm:px-6 sm:pt-8 xl:-mx-10 xl:px-10">
    <div class="mx-auto max-w-[1180px] space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="flex items-start gap-3">
                <span class="mt-[10px] h-2.5 w-8 shrink-0 rounded-full bg-[#114f8f]"></span>
                <div>
                    <p class="text-[11px] font-black uppercase tracking-[0.22em] text-[#114f8f]">Order Detail</p>
                    <h1 class="mt-2 text-[28px] font-black tracking-tight text-gray-900 sm:text-[34px]">{{ $order->order_number }}</h1>
                    <p class="mt-2 max-w-[760px] text-sm text-gray-500">Placed {{ $order->created_at->format('M j, Y g:i A') }} by {{ $order->customer_name }}.</p>
                </div>
            </div>
            <a href="{{ route('dashboard.orders') }}" class="inline-flex h-11 items-center justify-center rounded-2xl bg-[#111827] px-5 text-[14px] font-black tracking-wide text-white transition hover:bg-black">
                Back to orders
            </a>
        </div>

        @if(session('success'))
            <div class="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">
                {{ session('success') }}
            </div>
        @endif

        @if($errors->any())
            <div class="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
                <div class="font-black">Please fix the form errors:</div>
                <ul class="mt-2 list-disc space-y-1 pl-5">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <section class="grid gap-4 md:grid-cols-4">
            <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div class="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Status</div>
                <div class="mt-3 inline-flex rounded-full border px-3 py-1 text-[12px] font-black uppercase tracking-[0.16em] {{ $statusTone($order->status) }}">{{ $statuses[$order->status] ?? ucfirst($order->status) }}</div>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div class="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Payment</div>
                <div class="mt-3 text-[22px] font-black tracking-tight text-gray-900">{{ $order->payment_method }}</div>
                <div class="mt-1 text-xs text-gray-500">{{ $paymentStatuses[$order->payment_status] ?? ucfirst($order->payment_status) }}</div>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div class="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Fulfillment</div>
                <div class="mt-3 text-[22px] font-black tracking-tight text-gray-900">{{ ucfirst($order->fulfillment_method) }}</div>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div class="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Total</div>
                <div class="mt-3 text-[22px] font-black tracking-tight text-gray-900">UGX {{ number_format((float) $order->total, 0) }}</div>
            </div>
        </section>

        <form method="POST" action="{{ route('dashboard.orders.update', $order->id) }}" class="space-y-6" onsubmit="return confirmOrderDelete(event)">
            @csrf
            @method('PATCH')

            <section class="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                <div class="border-b border-gray-100 px-5 py-5 sm:px-6">
                    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 class="text-[20px] font-black text-gray-900">Manage order</h2>
                            <p class="mt-1 text-sm text-gray-500">One form for customer details, status, tracking, notifications, and admin notes.</p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button type="submit" name="status" value="confirmed" class="rounded-full bg-sky-600 px-4 py-2 text-[12px] font-black uppercase tracking-wide text-white hover:bg-sky-700">Confirm</button>
                            <button type="submit" name="status" value="approved" class="rounded-full bg-blue-600 px-4 py-2 text-[12px] font-black uppercase tracking-wide text-white hover:bg-blue-700">Approve</button>
                            <button type="submit" name="status" value="shipped" class="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-black uppercase tracking-wide text-white hover:bg-indigo-700">Ship</button>
                            <button type="submit" name="status" value="delivered" class="rounded-full bg-green-600 px-4 py-2 text-[12px] font-black uppercase tracking-wide text-white hover:bg-green-700">Delivered</button>
                            <button type="submit" name="action" value="delete" class="rounded-full bg-red-600 px-4 py-2 text-[12px] font-black uppercase tracking-wide text-white hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>

                <div class="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.15fr)_360px] sm:p-6">
                    <div class="space-y-6">
                        <div class="grid gap-4 sm:grid-cols-2">
                            <label class="block">
                                <span class="text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Order status</span>
                                <select name="status" class="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none focus:border-[#114f8f]">
                                    @foreach($statuses as $value => $label)
                                        <option value="{{ $value }}" @selected(old('status', $order->status) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </label>
                            <label class="block">
                                <span class="text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Payment status</span>
                                <select name="payment_status" class="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none focus:border-[#114f8f]">
                                    @foreach($paymentStatuses as $value => $label)
                                        <option value="{{ $value }}" @selected(old('payment_status', $order->payment_status) === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </label>
                        </div>

                        <div class="grid gap-4 sm:grid-cols-2">
                            <label class="block">
                                <span class="text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Tracking number</span>
                                <input name="tracking_number" value="{{ old('tracking_number', $metadata['trackingNumber'] ?? '') }}" class="mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-[#114f8f]" placeholder="e.g. ME-TRACK-001" />
                            </label>
                            <label class="block">
                                <span class="text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Tracking URL</span>
                                <input name="tracking_url" value="{{ old('tracking_url', $metadata['trackingUrl'] ?? '') }}" class="mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-[#114f8f]" placeholder="https://..." />
                            </label>
                        </div>

                        <label class="block">
                            <span class="text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Customer notification message</span>
                            <textarea name="customer_note" rows="3" class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#114f8f]" placeholder="Message visible to the customer in their account order tracking.">{{ old('customer_note', $metadata['customerNote'] ?? '') }}</textarea>
                        </label>

                        <label class="block">
                            <span class="text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Internal admin note</span>
                            <textarea name="admin_note" rows="3" class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#114f8f]" placeholder="Private note for staff only.">{{ old('admin_note', $metadata['adminNote'] ?? '') }}</textarea>
                        </label>

                        <label class="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                            <input type="checkbox" name="notify_customer" value="1" class="mt-1" @checked(old('notify_customer', $metadata['notifyCustomer'] ?? true)) />
                            <span><strong>Notify customer in account tracking.</strong><br />The status update and customer message will appear on the storefront user order page.</span>
                        </label>
                    </div>

                    <aside class="space-y-4">
                        <section class="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                            <h3 class="text-[16px] font-black text-gray-900">Customer</h3>
                            <div class="mt-4 space-y-2 text-sm text-gray-600">
                                <div><span class="font-bold text-gray-900">Name:</span> {{ $order->customer_name }}</div>
                                <div><span class="font-bold text-gray-900">Phone:</span> {{ $order->customer_phone ?: '—' }}</div>
                                <div><span class="font-bold text-gray-900">Email:</span> {{ $order->customer_email ?: '—' }}</div>
                            </div>
                        </section>

                        <section class="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                            <h3 class="text-[16px] font-black text-gray-900">Delivery / Pickup</h3>
                            <div class="mt-4 text-sm leading-6 text-gray-600">
                                @if($order->fulfillment_method === 'pickup')
                                    <div class="font-bold text-gray-900">{{ $order->pickup_location_title ?: 'Pickup location' }}</div>
                                @endif
                                <div>{{ $order->address ?: 'No address saved' }}</div>
                                <div>{{ collect([$order->city, $order->country])->filter()->join(', ') ?: 'No city/country saved' }}</div>
                            </div>
                        </section>

                        <section class="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                            <h3 class="text-[16px] font-black text-gray-900">Customer tracking timeline</h3>
                            <div class="mt-4 space-y-3">
                                @forelse($history as $entry)
                                    <div class="rounded-xl border border-gray-200 bg-white p-3">
                                        <div class="text-[12px] font-black uppercase tracking-wide text-gray-900">{{ $entry['label'] ?? ucfirst($entry['status'] ?? 'Status update') }}</div>
                                        <p class="mt-1 text-[13px] text-gray-600">{{ $entry['message'] ?? 'Order status updated.' }}</p>
                                        <p class="mt-1 text-[11px] text-gray-400">{{ isset($entry['changedAt']) ? \Carbon\Carbon::parse($entry['changedAt'])->format('M j, Y g:i A') : '' }}</p>
                                    </div>
                                @empty
                                    <p class="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">No tracking updates yet. Change the order status to create the first customer-visible update.</p>
                                @endforelse
                            </div>
                        </section>
                    </aside>
                </div>

                <div class="flex flex-col gap-3 border-t border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p class="text-sm text-gray-500">Saving updates the order and adds a customer-visible tracking event when the status changes.</p>
                    <button type="submit" class="inline-flex h-12 items-center justify-center rounded-2xl bg-[#111827] px-6 text-[14px] font-black tracking-wide text-white hover:bg-black">
                        Save order updates
                    </button>
                </div>
            </section>
        </form>

        <section class="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div class="border-b border-gray-100 px-6 py-5">
                <h2 class="text-[20px] font-black text-gray-900">Order items</h2>
            </div>
            <div class="divide-y divide-gray-100">
                @foreach($order->items as $item)
                    <div class="grid gap-4 px-6 py-5 sm:grid-cols-[70px_minmax(0,1fr)_100px_140px] sm:items-center">
                        <div class="h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                            @if($item->image)
                                <img src="{{ $item->image }}" alt="{{ $item->name }}" class="h-full w-full object-contain" />
                            @endif
                        </div>
                        <div>
                            <div class="text-[15px] font-bold text-gray-900">{{ $item->name }}</div>
                            <div class="mt-1 text-[13px] text-gray-500">{{ $item->href ?: 'No product link saved' }}</div>
                            <div class="mt-1 text-[12px] text-gray-400">Unit: UGX {{ number_format((float) $item->unit_price, 0) }}</div>
                        </div>
                        <div class="text-[14px] text-gray-600">Qty {{ $item->quantity }}</div>
                        <div class="text-left text-[15px] font-black text-gray-900 sm:text-right">UGX {{ number_format((float) $item->line_total, 0) }}</div>
                    </div>
                @endforeach
            </div>
        </section>
    </div>
</div>

<script>
function confirmOrderDelete(event) {
    const submitter = event.submitter;
    if (submitter && submitter.name === 'action' && submitter.value === 'delete') {
        return window.confirm('Delete this order permanently? This cannot be undone.');
    }
    return true;
}
</script>
@endsection
