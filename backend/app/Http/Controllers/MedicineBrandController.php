<?php

namespace App\Http\Controllers;

use App\Models\MedicineBrand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MedicineBrandController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicineBrand::query();

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $brands = $query->orderBy('name')->get();
        return response()->json($brands);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_brands,name',
            'manufacturer' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $brand = MedicineBrand::create($validator->validated());
        return response()->json(['message' => 'Brand created.', 'brand' => $brand], 201);
    }

    public function update(Request $request, MedicineBrand $brand)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_brands,name,' . $brand->id,
            'manufacturer' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $brand->update($validator->validated());
        return response()->json(['message' => 'Brand updated.', 'brand' => $brand]);
    }

    public function destroy(MedicineBrand $brand)
    {
        $brand->delete();
        return response()->json(['message' => 'Brand deleted.']);
    }
}
