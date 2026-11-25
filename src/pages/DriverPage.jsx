import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MobileApp from '../components/mobile/MobileApp';

export default function DriverPage() {
  const { sku } = useParams();
  const [searchParams] = useSearchParams();
  const { setActiveSku } = useApp();

  useEffect(() => {
    const querySku = searchParams.get('sku');
    if (sku) {
      setActiveSku(sku.toUpperCase());
    } else if (querySku) {
      setActiveSku(querySku.toUpperCase());
    }
  }, [sku, searchParams, setActiveSku]);

  return (
    <div className="min-h-screen bg-slate-100/70 flex justify-center items-start">
      <div className="w-full max-w-md min-h-screen bg-slate-50 shadow-xl border-x border-slate-200/80 relative">
        <MobileApp />
      </div>
    </div>
  );
}
