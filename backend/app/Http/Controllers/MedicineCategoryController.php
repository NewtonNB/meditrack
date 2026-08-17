<?php

namespace App\Http\Controllers;

use App\Models\MedicineCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MedicineCategoryController extends Controller
{
    /**
     * Get all categories
     */
    public function index(Request $request)
    {
        $query = MedicineCategory::query();

        // Filter active only
        if ($request->boolean('active_only')) {
            $query->active();
        }

        // Include deleted
        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $categories = $query->ordered()->get();

        return response()->json($categories);
    }

    /**
     * Create new category
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_categories,name',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = MedicineCategory::create($validator->validated());

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $category,
        ], 201);
    }

    /**
     * Update category
     */
    public function update(Request $request, MedicineCategory $category)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_categories,name,' . $category->id,
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category->update($validator->validated());

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $category,
        ]);
    }

    /**
     * Delete category
     */
    public function destroy(MedicineCategory $category)
    {
        // Check if category is in use
        $medicineCount = $category->medicines()->count();
        
        if ($medicineCount > 0) {
            return response()->json([
                'message' => "Cannot delete category. It is used by {$medicineCount} medicine(s).",
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }

    /**
     * Restore deleted category
     */
    public function restore($id)
    {
        $category = MedicineCategory::withTrashed()->findOrFail($id);
        $category->restore();

        return response()->json([
            'message' => 'Category restored successfully.',
            'category' => $category,
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive(MedicineCategory $category)
    {
        $category->update(['is_active' => !$category->is_active]);

        return response()->json([
            'message' => $category->is_active ? 'Category activated.' : 'Category deactivated.',
            'category' => $category,
        ]);
    }
}
