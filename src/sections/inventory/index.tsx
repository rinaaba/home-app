import { Route, Routes } from 'react-router-dom';
import type { AppSection } from '../../app/sectionTypes';
import { InventoryProvider } from './InventoryContext';
import { GalleryPage } from './pages/GalleryPage';
import { AddItemPage } from './pages/AddItemPage';
import { ItemPage } from './pages/ItemPage';
import { EditItemPage } from './pages/EditItemPage';
import { HomesPage } from './pages/HomesPage';

function InventoryRoutes() {
  return (
    <InventoryProvider>
      <Routes>
        <Route index element={<GalleryPage />} />
        <Route path="add" element={<AddItemPage />} />
        <Route path="item/:id" element={<ItemPage />} />
        <Route path="item/:id/edit" element={<EditItemPage />} />
        <Route path="homes" element={<HomesPage />} />
      </Routes>
    </InventoryProvider>
  );
}

export const inventorySection: AppSection = {
  id: 'inventory',
  title: 'Inventory',
  icon: '📦',
  path: 'inventory',
  Component: InventoryRoutes,
};
