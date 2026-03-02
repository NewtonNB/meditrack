// Common medicines database for easy selection
export const commonMedicines = [
  // Pain Relief & Fever
  { name: 'Paracetamol 500mg', category: 'Pain Relief', brand: 'GSK' },
  { name: 'Paracetamol 1000mg', category: 'Pain Relief', brand: 'GSK' },
  { name: 'Ibuprofen 400mg', category: 'Pain Relief', brand: 'Pfizer' },
  { name: 'Ibuprofen 600mg', category: 'Pain Relief', brand: 'Pfizer' },
  { name: 'Aspirin 75mg', category: 'Pain Relief', brand: 'Bayer' },
  { name: 'Aspirin 300mg', category: 'Pain Relief', brand: 'Bayer' },
  { name: 'Diclofenac 50mg', category: 'Pain Relief', brand: 'Novartis' },
  { name: 'Tramadol 50mg', category: 'Pain Relief', brand: 'Grünenthal' },

  // Antibiotics
  { name: 'Amoxicillin 250mg', category: 'Antibiotics', brand: 'Cipla' },
  { name: 'Amoxicillin 500mg', category: 'Antibiotics', brand: 'Cipla' },
  { name: 'Amoxicillin/Clavulanate 625mg', category: 'Antibiotics', brand: 'GSK' },
  { name: 'Azithromycin 250mg', category: 'Antibiotics', brand: 'Pfizer' },
  { name: 'Azithromycin 500mg', category: 'Antibiotics', brand: 'Pfizer' },
  { name: 'Ciprofloxacin 500mg', category: 'Antibiotics', brand: 'Bayer' },
  { name: 'Doxycycline 100mg', category: 'Antibiotics', brand: 'Pfizer' },
  { name: 'Erythromycin 250mg', category: 'Antibiotics', brand: 'Abbott' },
  { name: 'Metronidazole 400mg', category: 'Antibiotics', brand: 'Sanofi' },
  { name: 'Clindamycin 300mg', category: 'Antibiotics', brand: 'Pfizer' },

  // Respiratory
  { name: 'Cough Syrup 100ml', category: 'Respiratory', brand: 'Benylin' },
  { name: 'Cough Syrup 200ml', category: 'Respiratory', brand: 'Benylin' },
  { name: 'Salbutamol Inhaler', category: 'Respiratory', brand: 'GSK' },
  { name: 'Prednisolone 5mg', category: 'Respiratory', brand: 'Pfizer' },
  { name: 'Loratadine 10mg', category: 'Respiratory', brand: 'Bayer' },
  { name: 'Cetirizine 10mg', category: 'Respiratory', brand: 'UCB' },
  { name: 'Montelukast 10mg', category: 'Respiratory', brand: 'Merck' },

  // Gastrointestinal
  { name: 'Omeprazole 20mg', category: 'Gastrointestinal', brand: 'AstraZeneca' },
  { name: 'Omeprazole 40mg', category: 'Gastrointestinal', brand: 'AstraZeneca' },
  { name: 'Ranitidine 150mg', category: 'Gastrointestinal', brand: 'GSK' },
  { name: 'Loperamide 2mg', category: 'Gastrointestinal', brand: 'Johnson & Johnson' },
  { name: 'Oral Rehydration Salts', category: 'Gastrointestinal', brand: 'WHO' },
  { name: 'Simethicone 40mg', category: 'Gastrointestinal', brand: 'Pfizer' },

  // Cardiovascular
  { name: 'Amlodipine 5mg', category: 'Cardiovascular', brand: 'Pfizer' },
  { name: 'Amlodipine 10mg', category: 'Cardiovascular', brand: 'Pfizer' },
  { name: 'Atenolol 50mg', category: 'Cardiovascular', brand: 'AstraZeneca' },
  { name: 'Lisinopril 10mg', category: 'Cardiovascular', brand: 'Merck' },
  { name: 'Simvastatin 20mg', category: 'Cardiovascular', brand: 'Merck' },
  { name: 'Atorvastatin 20mg', category: 'Cardiovascular', brand: 'Pfizer' },

  // Diabetes
  { name: 'Metformin 500mg', category: 'Diabetes', brand: 'Bristol Myers' },
  { name: 'Metformin 850mg', category: 'Diabetes', brand: 'Bristol Myers' },
  { name: 'Glibenclamide 5mg', category: 'Diabetes', brand: 'Sanofi' },
  { name: 'Insulin (Human) 100IU/ml', category: 'Diabetes', brand: 'Novo Nordisk' },

  // Vitamins & Supplements
  { name: 'Vitamin C 1000mg', category: 'Vitamins', brand: 'Nature Made' },
  { name: 'Vitamin D3 1000IU', category: 'Vitamins', brand: 'Nature Made' },
  { name: 'Vitamin B Complex', category: 'Vitamins', brand: 'Nature Made' },
  { name: 'Folic Acid 5mg', category: 'Vitamins', brand: 'GSK' },
  { name: 'Iron Tablets 200mg', category: 'Vitamins', brand: 'Ranbaxy' },
  { name: 'Calcium + Vitamin D', category: 'Vitamins', brand: 'Pfizer' },
  { name: 'Multivitamin Tablets', category: 'Vitamins', brand: 'Centrum' },

  // Antimalarials
  { name: 'Artemether/Lumefantrine', category: 'Antimalarials', brand: 'Novartis' },
  { name: 'Quinine 300mg', category: 'Antimalarials', brand: 'Sanofi' },
  { name: 'Doxycycline 100mg (Malaria)', category: 'Antimalarials', brand: 'Pfizer' },

  // Topical/External
  { name: 'Hydrocortisone Cream 1%', category: 'Topical', brand: 'GSK' },
  { name: 'Betamethasone Cream', category: 'Topical', brand: 'GSK' },
  { name: 'Antifungal Cream', category: 'Topical', brand: 'Bayer' },
  { name: 'Antiseptic Solution', category: 'Topical', brand: 'Dettol' },
  { name: 'Eye Drops (Antibiotic)', category: 'Topical', brand: 'Allergan' },

  // Women's Health
  { name: 'Oral Contraceptive Pills', category: 'Women\'s Health', brand: 'Bayer' },
  { name: 'Emergency Contraceptive', category: 'Women\'s Health', brand: 'HRA Pharma' },
  { name: 'Prenatal Vitamins', category: 'Women\'s Health', brand: 'Nature Made' },

  // Mental Health
  { name: 'Diazepam 5mg', category: 'Mental Health', brand: 'Roche' },
  { name: 'Fluoxetine 20mg', category: 'Mental Health', brand: 'Eli Lilly' },
  { name: 'Amitriptyline 25mg', category: 'Mental Health', brand: 'Merck' },
];

// Get unique categories - with safety check
export const medicineCategories = commonMedicines ? [...new Set(commonMedicines.map(m => m.category))].sort() : [];

// Get unique brands - with safety check
export const medicineBrands = commonMedicines ? [...new Set(commonMedicines.map(m => m.brand))].sort() : [];

// Search medicines by name
export const searchMedicines = (query) => {
  if (!commonMedicines || !Array.isArray(commonMedicines)) return [];
  if (!query) return commonMedicines;
  const q = query.toLowerCase();
  return commonMedicines.filter(m => 
    m?.name?.toLowerCase().includes(q) ||
    m?.category?.toLowerCase().includes(q) ||
    m?.brand?.toLowerCase().includes(q)
  );
};

// Get medicines by category - with safety check
export const getMedicinesByCategory = (category) => {
  if (!commonMedicines || !Array.isArray(commonMedicines)) return [];
  return commonMedicines.filter(m => m?.category === category);
};