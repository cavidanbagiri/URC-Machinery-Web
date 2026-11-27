// src/pages/RentalMachines.jsx
//
// Kiralık makine listesi artık **Tüm Makineler** sayfasının "Kiralık
// Makineler" sekmesinde yaşıyor (`components/rentalmachine/RentalMachinePanel`).
// Bu sayfa yalnızca eski bağlantıları (`/rental_machines`, dashboard kartı,
// mazot defteri) doğru sekmeye taşır; navbar'da ayrı giriş yoktur.
import { Navigate } from 'react-router-dom';

export default function RentalMachines() {
  return <Navigate to="/common_cars?tab=rental" replace />;
}
