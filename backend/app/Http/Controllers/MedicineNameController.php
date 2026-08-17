<?php

namespace App\Http\Controllers;

use App\Models\MedicineName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MedicineNameController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicineName::query();

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $names = $query->orderBy('name')->get();
        return response()->json($names);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_names,name',
            'generic_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $name = MedicineName::create($validator->validated());
        return response()->json(['message' => 'Medicine name created.', 'name' => $name], 201);
    }

    public function update(Request $request, MedicineName $name)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_names,name,' . $name->id,
            'generic_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $name->update($validator->validated());
        return response()->json(['message' => 'Medicine name updated.', 'name' => $name]);
    }

    public function destroy(MedicineName $name)
    {
        $name->delete();
        return response()->json(['message' => 'Medicine name deleted.']);
    }
}
