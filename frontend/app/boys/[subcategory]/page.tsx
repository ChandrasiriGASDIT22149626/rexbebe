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
    title: `${cleanTitle} - Baby Boys Luxury Collection | REXBEBE`,
    description: `Shop our tailored ${cleanTitle} collection for baby boys at REXBEBE. Breathable French linen, durable play rompers, and heirloom pastel tailoring.`,
    path: `/boys/${params.subcategory}`,
  });
}

export default function BoysSubcategoryPage({ params }: Props) {
  const cleanTitle = params.subcategory.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Boys', url: '/boys' },
    { name: cleanTitle, url: `/boys/${params.subcategory}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CategoryShoppingTemplate
        slug={params.subcategory}
        parentName="Boys"
        parentUrl="/boys"
      />
    </>
  );
}
