import React from 'react';
import { Category } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/explore?category=${encodeURIComponent(category.name)}`}
      className="group relative rounded-2xl overflow-hidden border border-earth-200/80 bg-white hover:border-forest-300 hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-earth-100">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover group-hover:scale-108 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-forest-900 group-hover:bg-white group-hover:text-forest-700 transition-colors shadow-2xs">
          <ArrowUpRight className="w-4 h-4" />
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-forest-950/60 backdrop-blur-xs px-2 py-0.5 rounded-md">
            {category.productCount} items
          </span>
          <h4 className="text-base font-bold text-white tracking-tight mt-1 leading-snug">
            {category.name}
          </h4>
        </div>
      </div>
    </Link>
  );
}
