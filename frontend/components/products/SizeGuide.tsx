import React from 'react';
import { Modal } from '../ui/Modal';

export function SizeGuide({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="REXBEBE Size Guide">
      <div className="space-y-4 text-xs text-stone-700">
        <p className="font-light leading-relaxed">
          Our garments are designed with generous heirloom sizing to allow effortless layering and room to grow.
        </p>

        <table className="w-full text-left border-collapse border border-stone-200">
          <thead>
            <tr className="bg-brand-50 border-b border-stone-200">
              <th className="p-2 border-r border-stone-200 font-semibold">Size</th>
              <th className="p-2 border-r border-stone-200 font-semibold">Age Range</th>
              <th className="p-2 border-r border-stone-200 font-semibold">Height (cm)</th>
              <th className="p-2 font-semibold">Weight (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            <tr>
              <td className="p-2 border-r border-stone-200 font-medium">Newborn</td>
              <td className="p-2 border-r border-stone-200">0 - 1 Months</td>
              <td className="p-2 border-r border-stone-200">50 - 56 cm</td>
              <td className="p-2">Up to 4.5 kg</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-stone-200 font-medium">0-3 Months</td>
              <td className="p-2 border-r border-stone-200">1 - 3 Months</td>
              <td className="p-2 border-r border-stone-200">56 - 62 cm</td>
              <td className="p-2">4.5 - 6.5 kg</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-stone-200 font-medium">3-6 Months</td>
              <td className="p-2 border-r border-stone-200">3 - 6 Months</td>
              <td className="p-2 border-r border-stone-200">62 - 68 cm</td>
              <td className="p-2">6.5 - 8.0 kg</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-stone-200 font-medium">6-12 Months</td>
              <td className="p-2 border-r border-stone-200">6 - 12 Months</td>
              <td className="p-2 border-r border-stone-200">68 - 78 cm</td>
              <td className="p-2">8.0 - 10.5 kg</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
