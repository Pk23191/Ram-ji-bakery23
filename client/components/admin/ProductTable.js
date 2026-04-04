import ProductImage from "../ProductImage";
import { PencilLine, Trash2 } from "lucide-react";

export default function ProductTable({ products = [], onEdit, onDelete, deletingId }) {
  return (
    <div className="rounded-lg border bg-white/85 p-4">
      <div className="w-full overflow-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-xs text-mocha/60">
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Images</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3 align-top">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 relative rounded-md overflow-hidden bg-latte/50">
                      <ProductImage src={p.images?.[0] || p.image} alt={p.name} fill className="object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-cocoa truncate">{p.name}</div>
                      <div className="text-xs text-mocha/60 truncate">{p.description}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 align-top">{p.category}</td>
                <td className="p-3 align-top">{(p.finalPrice ?? p.price) && `₹${(p.finalPrice ?? p.price)}`}</td>
                <td className="p-3 align-top">{p.images?.length || 0}</td>
                <td className="p-3 align-top">
                  <div className="flex gap-2">
                    <button className="btn-secondary px-3 py-2" onClick={() => onEdit(p)}>
                      <PencilLine size={14} />
                    </button>
                    <button
                      className="rounded-full border border-rose/30 px-3 py-2 text-sm font-semibold text-rose-600"
                      onClick={() => onDelete(p._id)}
                      disabled={deletingId === p._id}
                    >
                      {deletingId === p._id ? "Deleting..." : <><Trash2 size={14} /></>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
