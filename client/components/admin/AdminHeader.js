export default function AdminHeader({ title, subtitle, rightNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-caramel">{subtitle || 'Admin dashboard'}</p>
        <h1 className="mt-2 font-heading text-2xl md:text-3xl text-cocoa">{title || 'Owner panel'}</h1>
      </div>
      <div>{rightNode}</div>
    </div>
  );
}
