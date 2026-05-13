<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = $request->user('sanctum');

        if (! $profile) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $orders = Order::with('items')
            ->where('profile_id', $profile->id)
            ->latest()
            ->limit(25)
            ->get()
            ->map(fn (Order $order) => $this->formatOrder($order));

        return response()->json(['ok' => true, 'orders' => $orders]);
    }

    public function store(Request $request): JsonResponse
    {
        $profile = $request->user('sanctum');

        if (! $profile) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $data = $request->validate([
            'customer.fullName' => 'required|string|max:255',
            'customer.email' => 'nullable|email|max:255',
            'customer.phone' => 'nullable|string|max:50',
            'customer.address' => 'nullable|string|max:255',
            'customer.city' => 'nullable|string|max:120',
            'customer.country' => 'nullable|string|max:120',
            'fulfillmentMethod' => 'required|in:delivery,pickup',
            'paymentMethod' => 'required|string|max:120',
            'pickupLocation.id' => 'nullable|string|max:120',
            'pickupLocation.title' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|string|max:120',
            'items.*.name' => 'required|string|max:255',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.image' => 'nullable|string',
            'items.*.href' => 'nullable|string',
            'subtotal' => 'required|numeric|min:0',
            'shipping' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
        ]);

        $order = DB::transaction(function () use ($data, $profile) {
            $order = Order::create([
                'order_number' => $this->nextOrderNumber(),
                'profile_id' => $profile->id,
                'customer_name' => $data['customer']['fullName'],
                'customer_email' => $data['customer']['email'] ?? $profile->email,
                'customer_phone' => $data['customer']['phone'] ?? $profile->phone,
                'fulfillment_method' => $data['fulfillmentMethod'],
                'payment_method' => $data['paymentMethod'],
                'status' => 'pending',
                'payment_status' => $data['paymentMethod'] === 'Cash on Delivery' ? 'pending' : 'unpaid',
                'subtotal' => $data['subtotal'],
                'shipping_total' => $data['shipping'],
                'total' => $data['total'],
                'currency_code' => 'UGX',
                'address' => $data['customer']['address'] ?? null,
                'city' => $data['customer']['city'] ?? null,
                'country' => $data['customer']['country'] ?? null,
                'pickup_location_id' => $data['pickupLocation']['id'] ?? null,
                'pickup_location_title' => $data['pickupLocation']['title'] ?? null,
                'metadata' => [
                    'source' => 'storefront',
                    'pickupLocation' => $data['pickupLocation'] ?? null,
                ],
            ]);

            foreach ($data['items'] as $item) {
                $variant = ProductVariant::find($item['id']);
                $product = $variant?->product ?: Product::find($item['id']);
                $quantity = max(1, (int) $item['qty']);
                $unitPrice = (float) $item['price'];

                $order->items()->create([
                    'product_id' => $product?->id,
                    'variant_id' => $variant?->id,
                    'cart_item_id' => $item['id'],
                    'name' => $item['name'],
                    'image' => $item['image'] ?? null,
                    'href' => $item['href'] ?? null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $unitPrice * $quantity,
                ]);
            }

            return $order->load('items');
        });

        return response()->json(['ok' => true, 'order' => $this->formatOrder($order)], 201);
    }

    private function nextOrderNumber(): string
    {
        do {
            $number = 'ME-' . now()->format('ymd') . '-' . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }

    private function formatOrder(Order $order): array
    {
        $metadata = is_array($order->metadata) ? $order->metadata : [];
        $history = collect($metadata['statusHistory'] ?? [])->values();

        return [
            'id' => $order->id,
            'number' => $order->order_number,
            'status' => $order->status,
            'paymentStatus' => $order->payment_status,
            'fulfillmentMethod' => $order->fulfillment_method,
            'paymentMethod' => $order->payment_method,
            'subtotal' => (float) $order->subtotal,
            'shipping' => (float) $order->shipping_total,
            'total' => (float) $order->total,
            'currencyCode' => $order->currency_code,
            'placedAt' => optional($order->created_at)?->toISOString(),
            'trackingNumber' => $metadata['trackingNumber'] ?? null,
            'trackingUrl' => $metadata['trackingUrl'] ?? null,
            'customerNote' => $metadata['customerNote'] ?? null,
            'timeline' => $history->map(fn ($entry) => [
                'status' => $entry['status'] ?? 'updated',
                'label' => $entry['label'] ?? ucfirst($entry['status'] ?? 'Updated'),
                'message' => $entry['message'] ?? 'Order status updated.',
                'changedAt' => $entry['changedAt'] ?? null,
            ])->values(),
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'quantity' => $item->quantity,
                'unitPrice' => (float) $item->unit_price,
                'lineTotal' => (float) $item->line_total,
                'image' => $item->image,
                'href' => $item->href,
            ])->values(),
        ];
    }
}
