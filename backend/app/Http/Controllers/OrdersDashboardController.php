<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function show(string $id)
    {
        $order = Order::with(['profile', 'items'])->findOrFail($id);

        return view('admin.orders.show', [
            'order' => $order,
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:pending,processing,ready,shipped,delivered,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $data['status']]);

        return response()->json(['ok' => true, 'status' => $order->status]);
    }
}
