import React from 'react';
import type { Metadata } from 'next';
import { CategoryShoppingTemplate } from '../../../components/products/CategoryShoppingTemplate';
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../../config/seoConfig';

interface Props {
  params: { subcategory: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cleanTitle = params.subcategory.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return generateCategoryMetadata({
    title: `${cleanTitle} - Newborn & Baby Essentials | REXBEBE`,
    description: `Shop our gentle ${cleanTitle} collection for newborns and babies at REXBEBE. Cloud-soft certified organic cotton, hypoallergenic swaddles, and first-moment essentials.`,
    path: `/baby/${params.subcategory}`,
  });
}

export default function BabySubcategoryPage({ params }: Props) {
  const cleanTitle = params.subcategory.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Baby & Newborn', url: '/baby' },
    { name: cleanTitle, url: `/baby/${params.subcategory}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CategoryShoppingTemplate
        slug={params.subcategory}
        parentName="Baby"
        parentUrl="/baby"
      />
    </>
  );
}
