@component('mail::message')
# Purchase Order {{ ucfirst($action) }}

@if($action === 'created')
A new purchase order has been created and requires your attention.
@elseif($action === 'received')
A purchase order has been successfully received and stock has been updated.
@elseif($action === 'cancelled')
A purchase order has been cancelled.
@else
A purchase order has been updated.
@endif

## Order Details

**Purchase Order:** {{ $purchase->purchase_number }}  
**Supplier:** {{ $purchase->supplier->name ?? 'Unknown' }}  
**Total Amount:** UGX {{ number_format($purchase->total_amount) }}  
**Items:** {{ $items_count }} item(s)  
**Created By:** {{ $created_by }}  
**Date:** {{ $timestamp->format('M d, Y \a\t g:i A') }}

@if($purchase->notes)
**Notes:** {{ $purchase->notes }}
@endif

## Items Ordered

@foreach($purchase->items as $item)
- **{{ $item->medicine->name ?? 'Unknown Medicine' }}**  
  Quantity: {{ $item->quantity_ordered }}  
  Unit Cost: UGX {{ number_format($item->unit_cost) }}  
  Total: UGX {{ number_format($item->total_cost) }}
@endforeach

@if($action === 'created')
@component('mail::button', ['url' => route('purchases.show', $purchase->id)])
View Purchase Order
@endcomponent

Please review and approve this purchase order at your earliest convenience.
@elseif($action === 'received')
@component('mail::button', ['url' => route('medicines.index')])
View Updated Inventory
@endcomponent

The inventory has been automatically updated with the received items.
@endif

Thanks,<br>
{{ config('app.name') }} System

@component('mail::subcopy')
This is an automated notification from the {{ config('app.name') }} pharmacy management system.
@endcomponent
@endcomponent