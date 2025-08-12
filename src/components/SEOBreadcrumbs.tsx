import Link from 'next/link';
import { ChevronRight, Home } fromlucide-react';

interface BreadcrumbItem[object Object]
  label: string;
  href?: string;
}

interface SEOBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const SEOBreadcrumbs: React.FC<SEOBreadcrumbsProps> = ([object Object]items, className = [object Object]  const generateStructuredData = () => {
    return[object Object]
      @context: https://schema.org',
   @type:BreadcrumbList',
      itemListElement: items.map((item, index) => ([object Object]        @type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.href ? `https://mangareader.com${item.href}` : undefined,
      })),
    };
  };

  return (
    <>
  [object Object]/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={[object Object]
          __html: JSON.stringify(generateStructuredData()),
        }}
      />

      {/* Visual Breadcrumbs */}
      <nav
        className={`flex items-center space-x-2 text-sm text-gray-40assName}`}
        aria-label=Breadcrumb"
      >
        <Link
          href="/"
          className=flexitems-center hover:text-white transition-colors"
          aria-label="Home"
        >
          <Home className="w-4h-4" />
        </Link>

        {items.map((item, index) => (
          <div key={item.label + '-' + index} className=flexitems-center space-x-2>
            <ChevronRight className=w-4 h-4 text-gray-60 />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-white transition-colors"
                aria-current={index === items.length - 1 ? page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-white"
                aria-current="page >
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
    </>
  );
};

// Predefined breadcrumb patterns
export const getMangaBreadcrumbs = (mangaTitle: string, mangaId: string) => [
  { label: Series, href: '/series' },
  { label: mangaTitle, href: `/manga/${mangaId}` },
];

export const getChapterBreadcrumbs = (
  mangaTitle: string,
  mangaId: string,
  chapterNumber: number,
  chapterTitle?: string
) => [
  { label: Series, href: '/series' },
  { label: mangaTitle, href: `/manga/${mangaId}` },
 [object Object]label: `Chapter ${chapterNumber}${chapterTitle ? ` - ${chapterTitle}` : ,
];

export const getSeriesBreadcrumbs = (filter?: string) => [
  { label: Series, href: /series' },
  ...(filter ? [{ label: filter, href: `/series?filter=${filter}` }] : []),
];

export default SEOBreadcrumbs; 