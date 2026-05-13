<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class OrdersDashboardController extends Controller
{
    public function index()
    {
        $orders = Order::with(['profile', 'items'])
            ->latest()
            ->limit(50)
            ->get();

        $pendingCount = Order::where('status', 'pending')->count();
        $todayCount = Order::whereDate('created_at', today())->count();
        $todayRevenue = Order::whereDate('created_at', today())->sum('total');
        $revenue = Order::sum('total');
        $totalOrders = Order::count();
        $processingCount = Order::whereIn('status', ['processing', 'ready', 'shipped'])->count();
        $deliveredCount = Order::where('status', 'delivered')->count();
        $cancelledCount = Order::where('status', 'cancelled')->count();
        $issuesCount = Order::whereIn('status', ['cancelled', 'failed', 'refunded', 'exception'])->count();

        $cards = [
            ['label' => 'Total Orders', 'value' => number_format($totalOrders), 'note' => 'Orders placed through the storefront checkout.'],
            ['label' => 'Pending', 'value' => number_format($pendingCount), 'note' => 'Orders waiting for staff review or fulfillment.'],
            ['label' => 'Today', 'value' => number_format($todayCount), 'note' => 'New orders received today.'],
            ['label' => 'Order Revenue', 'value' => 'UGX ' . number_format((float) $revenue, 0), 'note' => 'Gross order value before payment reconciliation.'],
        ];

        return view('admin.orders.index', [
            'cards' => $cards,
            'orders' => $orders,
            'customerCount' => Profile::where('role', 'customer')->count(),
            'publishedProducts' => Product::where('is_published', true)->count(),
            'totalOrders' => $totalOrders,
            'pendingOrders' => $pendingCount,
            'processingOrders' => $processingCount,
            'deliveredOrders' => $deliveredCount,
            'cancelledOrders' => $cancelledCount,
            'pendingOrdersCount' => $pendingCount + $processingCount,
            'processingOrdersCount' => $processingCount,
            'deliveredOrdersCount' => $deliveredCount,
            'cancelledOrdersCount' => $cancelledCount,
            'issuesCount' => $issuesCount,
            'todayOrderCount' => $todayCount,
            'todayRevenue' => (float) $todayRevenue,
            'todayRevenueLabel' => 'UGX ' . number_format((float) $todayRevenue, 0),
            'totalRevenue' => (float) $revenue,
            'totalRevenueLabel' => 'UGX ' . number_format((float) $revenue, 0),
        ]);
    }

    public function show(string $id): View
    {
        $order = Order::with(['profile', 'items'])->findOrFail($id);

        return view('admin.orders.show', [
            'order' => $order,
            'statuses' => $this->statuses(),
            'paymentStatuses' => $this->paymentStatuses(),
        ]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $order = Order::with('items')->findOrFail($id);

        if ($request->input('action') === 'delete') {
            $orderNumber = $order->order_number;
            $order->delete();

            return redirect()
                ->route('dashboard.orders')
                ->with('success', "Order {$orderNumber} was deleted.");
        }

        $data = $request->validate([
            'status' => 'required|in:' . implode(',', array_keys($this->statuses())),
            'payment_status' => 'required|in:' . implode(',', array_keys($this->paymentStatuses())),
            'tracking_number' => 'nullable|string|max:120',
            'tracking_url' => 'nullable|url|max:500',
            'admin_note' => 'nullable|string|max:1200',
            'customer_note' => 'nullable|string|max:1200',
            'notify_customer' => 'nullable|boolean',
        ]);

        $previousStatus = $order->status;
        $metadata = is_array($order->metadata) ? $order->metadata : [];
        $history = is_array($metadata['statusHistory'] ?? null) ? $metadata['statusHistory'] : [];
        $notifyCustomer = $request->boolean('notify_customer');

        if ($previousStatus !== $data['status']) {
            $history[] = [
                'status' => $data['status'],
                'label' => $this->statuses()[$data['status']] ?? ucfirst($data['status']),
                'message' => $data['customer_note'] ?: $this->defaultCustomerMessage($data['status']),
                'changedAt' => now()->toISOString(),
                'notifyCustomer' => $notifyCustomer,
            ];
        }

        $metadata['trackingNumber'] = $data['tracking_number'] ?? null;
        $metadata['trackingUrl'] = $data['tracking_url'] ?? null;
        $metadata['adminNote'] = $data['admin_note'] ?? null;
        $metadata['customerNote'] = $data['customer_note'] ?? null;
        $metadata['notifyCustomer'] = $notifyCustomer;
        $metadata['statusHistory'] = $history;

        $order->update([
            'status' => $data['status'],
            'payment_status' => $data['payment_status'],
            'metadata' => $metadata,
        ]);

        return redirect()
            ->route('dashboard.orders.show', $order->id)
            ->with('success', 'Order updated successfully.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $order = Order::findOrFail($id);
        $orderNumber = $order->order_number;
        $order->delete();

        return redirect()
            ->route('dashboard.orders')
            ->with('success', "Order {$orderNumber} was deleted.");
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:' . implode(',', array_keys($this->statuses())),
        ]);

        $order = Order::findOrFail($id);
        $metadata = is_array($order->metadata) ? $order->metadata : [];
        $history = is_array($metadata['statusHistory'] ?? null) ? $metadata['statusHistory'] : [];

        if ($order->status !== $data['status']) {
            $history[] = [
                'status' => $data['status'],
                'label' => $this->statuses()[$data['status']] ?? ucfirst($data['status']),
                'message' => $this->defaultCustomerMessage($data['status']),
                'changedAt' => now()->toISOString(),
                'notifyCustomer' => true,
            ];
            $metadata['statusHistory'] = $history;
        }

        $order->update(['status' => $data['status'], 'metadata' => $metadata]);

        return response()->json(['ok' => true, 'status' => $order->status]);
    }

    private function statuses(): array
    {
        return [
            'pending' => 'Pending review',
            'confirmed' => 'Confirmed',
            'approved' => 'Approved',
            'processing' => 'Processing',
            'ready' => 'Ready for dispatch',
            'shipped' => 'Shipped',
            'delivered' => 'Delivered',
            'cancelled' => 'Cancelled',
            'failed' => 'Failed',
            'refunded' => 'Refunded',
        ];
    }

    private function paymentStatuses(): array
    {
        return [
            'unpaid' => 'Unpaid',
            'pending' => 'Pending',
            'paid' => 'Paid',
            'failed' => 'Failed',
            'refunded' => 'Refunded',
        ];
    }

    private function defaultCustomerMessage(string $status): string
    {
        return match ($status) {
            'confirmed' => 'Your order has been confirmed by Modern Electronics.',
            'approved' => 'Your order has been approved and is being prepared.',
            'processing' => 'Your order is now being processed.',
            'ready' => 'Your order is ready for dispatch or pickup.',
            'shipped' => 'Your order has been shipped. You can track it from your account.',
            'delivered' => 'Your order has been delivered. Thank you for shopping with us.',
            'cancelled' => 'Your order has been cancelled. Contact support if you need help.',
            default => 'Your order status has been updated.',
        };
    }
}

